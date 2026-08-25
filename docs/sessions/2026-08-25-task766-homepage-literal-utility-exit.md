# Task 766 — Homepage: remove the last production Tailwind utility strings

**Status:** `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` — Sonnet executor session, 2026-08-25 (started 2026-08-24).
Not self-approved. Kickoff: `tasks/Sprints/Sprint_65_kickoff_prompt_Task_766_Homepage_Literal_Utility_Exit.md`.

**Revision 1 note (2026-08-25):** the original submission's review verdict was `NEEDS REVISION`
(`tasks/Sprints/Sprint_65_Task_766_revision_1_gate_traversal_and_failure_proof.md`, E-1). The shipped
`check:homepage-literal-utilities` traversal rejected only the two literal shapes its own plants replayed and let
five other reachable shapes and two additionally-named sites pass at exit 0. This revision widens
`scripts/check-homepage-literal-utilities.mjs` (R11/R12), corrects its header (R13), and closes four evidence gaps
in this log (R14) below. No product code (`.tsx`/`.module.css`/`globals.css`/`layout.tsx`) changed in this revision
— §1–§8, §11 and §13–§15 below are unchanged from the original submission and were **not** re-verified, per the
revision brief §10 (re-running `build`, `build-storybook`, `screenshots:assert`, `check:hydration`, or the route
probe is not required and nothing they measure could have changed). The edits below are: this note; §5 (plant
transcripts replaced with the R11/R12 set); §6 (`resolvedFrom` wording downgraded, same caveat added to the probe
header); §9 (the `screenshots:responsive:storybook` row annotated as non-coverage); §10 (the 32/32 MD5 result, its
command/output, and the manifest counts added); §12/§14 (the `@mantine/core` 8.3.18 dependency recorded as a
future-risk note).

**Revision 2 note (2026-08-25):** Revision 1 was itself returned `NEEDS REVISION`, with two further defects in the
widened traversal. (1) A computed clsx object key (`{ [LOCAL_CLS]: cond }`) was only checked when
`ComputedPropertyName.expression` was a **direct** `StringLiteral` — an identifier resolving to a same-file `const`
string literal in that position passed at exit 0, uncaught. (2) Same-file `const` identifier resolution was a flat,
file-wide `Map<name, decl>` keyed only by name, with no scope awareness — a same-named function parameter (legal
shadowing) did not stop the gate from reading through to an outer, unrelated `const` of the same name, which is a
**false-positive** risk in the opposite direction from (1)'s false-negative. Both are fixed in
`scripts/check-homepage-literal-utilities.mjs`: computed keys now resolve through the same expression walk as every
other site (so identifier indirection reaches them too), and identifier resolution is now a genuine lexical scope
walk — nearest enclosing binding wins, exactly as JS/TS scoping shadows — instead of a flat name lookup. No product
code changed in this revision either. New plants: the computed-key-via-identifier violation (exit 1) and the
parameter-shadows-outer-const negative control (exit 0), both recorded in §5 below. §5's opening paragraph, which
had gone stale describing the pre-Revision-1 traversal, is also corrected here to match the current code and to stop
restating detail that belongs only in the script's own header.

**Revision 3 note (2026-08-25):** Revision 2's own resolver was also returned `NEEDS REVISION` — its scope model was
"scan the nearest `Block`/`SourceFile`'s `VariableStatement`s", which is not real JS/TS lexical resolution and had
one root defect with two independent symptoms, both reproduced against the Revision-2 code before the fix: (1) a
`for`/`for-in`/`for-of` statement's own declaration (`for (const C = 'overflow-hidden'; ok;) { ... }`) was invisible
to the resolver entirely — it only ever scanned `Block`/`SourceFile` statement lists, never a `for` statement's
`initializer` — so the gate either missed the loop's own shadowing `const` outright, or, if an outer same-named
`const` existed, misread through the loop and reported the **wrong** (outer) literal; (2) a destructured declaration
sharing the target's exact name (`const { C } = props`) was not recognized as a distinct binding kind — the resolver
only checked `decl.name` as a plain `Identifier`, so a destructuring pattern never matched by name at all, and
identifier resolution fell through to whatever outer `const` of that name existed, again misreading through a real
shadow. `resolveIdentifierLexically()` is rewritten in `scripts/check-homepage-literal-utilities.mjs` to walk actual
JS/TS runtime bindings at every ancestor step — function/arrow/method/constructor/accessor names and parameter lists
(simple or destructured), `for`/`for-in`/`for-of` declarations, `catch` bindings (simple or destructured), `switch`'s
shared cross-clause scope, and block/source-file `const`/`let`/`var` (simple or destructured), `import` bindings,
and function/class declaration names — stopping at the first real binding found, whatever kind it is, and resolving
a literal only when that nearest binding is a **simple**, non-destructured `const` with an initializer. No product
code changed in this revision. Four new plants (§5): a positive `for`-shadowing case and three negative controls
(destructured-rename, same-name destructuring, `catch` shadow) — plus a full re-run of all 15 previously documented
Revision 1–2 plants, unchanged results. The header is corrected to state only the binding forms actually implemented.

**Revision 4 note (2026-08-25):** Revision 3's resolver was also returned `NEEDS REVISION` — `var` is scoped to its
whole enclosing function or the source file in real JS, not to whichever nested block declares it, but Revision 3's
`ts.isBlock(parent)`/`ts.isSourceFile(parent)` check only ever inspected the exact block a use-site's climb was
currently passing through. Reproduced against the exact shipped Revision-3 resolver before the fix:

```
const C = 'animate-spin'

function View() {
  if (ready) {
    var C = className
  }
  return <Box className={C} />
}
```

The `<Box className={C}>` use-site's climb reaches `View`'s own body block first — `var C` is not a *direct*
statement of that block (it is nested one level deeper, inside the `if`'s own block), so the per-block scan found
nothing there, and the walk continued outward past `View` to the module-scope `const C = 'animate-spin'`, wrongly
resolving and reporting it — exactly the false positive the brief names. `resolveIdentifierLexically()` is changed
so that, at the same step it reaches a function/arrow/method/constructor/accessor boundary or the source file
itself, it additionally collects every `var` **hoisted** into that whole function/source scope — walking every
descendant block/`if`/loop/`catch`/`switch` body and every `for`/`for-in`/`for-of` initializer's own `var`
declarations, but never descending into a nested function/class body (which owns its own separate `var` scope) —
and treats a match as opaque, stopping the search before it can ever reach a further-out scope. No product code
changed in this revision. Two new plants (§5): the exact bug-repro shape (nested `var` shadowing an outer `const`,
exit 0) and a `var` declared inside a `for` body and used after the loop (exit 0) — plus a full re-run of all 19
previously documented Revision 1–3 plants, unchanged results. The header is corrected to state that `var` resolves
by function/source hoisting scope, distinct from `const`/`let`'s block scope.

**Revision 5 note (2026-08-25):** Revision 4's verdict on the traversal was `NEEDS REVISION` on a different axis —
not a specific missed binding form, but the whole model: *"rejects **any** static class literal at those sites"*
(kickoff §6) is a universally quantified sentence, and a finite list of permitted AST node kinds can never satisfy
it — each of the four prior rounds closed exactly the node kinds its own brief named, and a fifth adversarial pass
still found seven more (`as const`, `satisfies`, spread, `+` composition, the comma operator, plus two declared-
opaque-but-previously-uncovered `let`/`var` sanity checks) in a single sweep. Revisions 1–4 are **accepted in full
and independently verified** by the reviewer (revision brief §1) — this is not a defect in any of them, and none of
`resolveIdentifierLexically()` or the functions it calls (`matchStatement`, `matchStatements`,
`matchDeclarationList`, `matchImportBinding`, `bindingNames`, `isFunctionLikeWithParams`, `isFunctionOrClassScope`,
`collectHoistedVarNames`) changed in this revision. `collectLiterals()` — a node-kind list whose `BinaryExpression`
branch silently returned nothing for every operator but `&&`/`||`/`??`, and which had no default branch for any
other unlisted node kind — is replaced by `foldClassExpression()`, a ~150-line evaluator built from five rules over
what an expression's runtime value can statically be, not from which AST node kinds someone thought to list: value-
preserving wrappers are transparent (Rule 1), branching yields the union of reachable operands (Rule 2), composition
preserves literal chunks (Rule 3), aggregation sites recurse into their elements (Rule 4), and bindings fold only
through language-guaranteed values — a simple `const` with an initializer, never a mutable binding (Rule 5, the
boundary reproduced verbatim in §4 below and in the script header). The evaluator is one `switch` over the
expression's AST kind ending in exactly one explicit `default: return DYNAMIC` — the sole, permanent, documented
fail-open point, not the multiple silent no-result branches `collectLiterals()` had. A `--explain <file>` mode is
added so this boundary is auditable by running the gate against any file, not by re-reading a comment. No product
code changed in this revision; §1–§8, §11 and §13–§15 remain unchanged from the original submission. The R18 corpus
below in §5 replaces the Revision 1–4 plant-by-plant tables — the corpus re-runs every one of those 21 forms
(re-verifying they are unchanged) plus 5 newly-covered forms, 8 additional rule-level cases probing composition,
identifiers and aggregation together, the 2 declared-opaque forms, and the 5 permitted forms — 41 rows in total, all
individually planted, run, and reverted, each with a real unpiped exit code. Adversarial probing during this
revision itself (per the brief's own §9.3 instruction) found one more hole of the identical shape — a class string
composed entirely inside a template substitution (`` `${'flex' + ' flex-col'}` ``) passed uncaught, because
`TemplateExpression` folding inspected only its `head`/span text, never a substitution's own expression — and it is
fixed in this same revision, in both the evaluator and the header, not deferred.

**Revision 5.1 note (2026-08-25):** Revision 5 was returned `NEEDS REVISION` on a narrow, specific point — not the
evaluator model, and not a new coverage expansion. Rule 4's own stated contract ("a `SpreadElement` yields an array
literal's elements; a spread of anything else is dynamic") was violated by its shipped implementation, which simply
delegated a spread's operand to the general evaluator: `cn(...'overflow-hidden')` spreads the string's *characters*
into `cn()`, not the string as a class name, but `case ts.SyntaxKind.SpreadElement: return
foldClassExpression(expr.expression, sourceFile, seen);` still folded the bare string literal to itself and reported
`"overflow-hidden"` — a false positive on valid JS/TS. Fixed with a dedicated `resolveSpreadArrayLiteral()` that
proves a spread operand is an array literal — directly, through a Rule-1 transparent wrapper around one, or through
a simple non-destructured `const` alias chain (cycle-guarded against `const A = B; const B = A;`) — **before**
`foldClassExpression()` is ever invoked on the operand; only then are the array's own elements folded through the
normal evaluator. No other rule changed. `resolveIdentifierLexically()` and its helpers, `collectHoistedVarNames()`,
and `--explain`'s site collection are untouched, per the brief's explicit authorized-files boundary. No product code
changed. One defect was found and fixed during this revision's own implementation, before any plant was reported to
the brief's author: the first draft correctly proved the array via an alias chain but reported the finding's line at
the array literal's own declaration (e.g. `MantineListingCardPattern.tsx:9`, `ARR`'s line) instead of at the spread's
use site (`:315`), inconsistent with every other identifier-indirection case in this gate (Rows 5, 9, 10 all report
at the use site with `declLine` as the separate annotation). Fixed to override the reported node to the spread's own
operand identifier when resolution went through an alias, matching that established convention; S8 below is the
corrected result. The S1–S10 corpus (below) and a full re-run of the entire Revision 5 R18 corpus (41 rows,
including the newly-required n4 and Row 35) are recorded in §5.

## 1. I0 freshness re-measure

```
node.exe -p process.platform        -> win32
git --no-optional-locks status --short --branch -> ## main...origin/main, ?? Codex-tasks/
git --no-optional-locks log -1 --oneline -> 846113faa docs(Task766): open Sprint 65, file Task 766 ...
```

`HEAD` was one commit ahead of the kickoff's stated baseline `7b9a13c37`. Diffed
`git diff --stat 7b9a13c37 846113faa` -> `docs/backlog.md`, the Sprint 65 plan file, and the Task 766 kickoff file
only (638 insertions / 8 deletions, all docs). No production file differs from `7b9a13c37`. Baseline holds.

Census (`rg` via Grep tool, exact §10.0 pattern) — **exactly 6 live occurrences**, matching §3.1 line-for-line:

- `MantineListingCardPattern.tsx:186` `'overflow-hidden'`
- `MantineListingCardPattern.tsx:187` `isArchived && 'grayscale opacity-60'`
- `MantineListingCardPattern.tsx:314` `'flex flex-col'`
- `MantineListingCardPattern.tsx:315` `isArchived && 'grayscale opacity-60'`
- `LocaleSwitcher.tsx:55` `className="animate-spin"`
- `src/app/[locale]/layout.tsx:50` `className="min-h-[calc(100vh-4rem)]"` + trailing `design-tokens-allow:` marker

## 2. Canonical UI decision record

| Visible artifact | Search evidence | Canonical story/source | Decision | Consumed style/token path |
|---|---|---|---|---|
| Listing card, grid+list, normal+archived | Opened `src/stories/patterns/mantine/ListingCardPattern.stories.tsx` in full | `Patterns/Mantine/ListingCardPattern` -> `Default` (grid `id=6 archived`, list `id=12 archived`, real `MantineListingCardPattern`) | **reuse** | New `styles.archived` in `MantineListingCardPattern.module.css`, consumed by both `cn()` call sites |
| LocaleSwitcher, pending state | Opened `src/stories/mantine/primitives/LocaleSwitcher.stories.tsx` in full | `Mantine/Primitives/LocaleSwitcher` -> `Default`, third cell `isPending` | **reuse** | New `styles.pendingIcon` in `LocaleSwitcher.module.css`, `var(--motion-duration-spinner)` from `globals.css` `:root` |
| Route shell `<main>` min-height | Read `layout.tsx` in full; no Storybook story exists for a route layout by design | none | **reuse (Mantine style prop, no story needed)** | `mih="calc(100vh - 4rem)"` prop on the existing `Box` |

Zero new/extended stories. Zero probes needed — both required states are already rendered by the real production
component in the existing canonical stories, matching the kickoff's own §3.3 finding.

## 3. Visual source trace (baseline, measured before any edit)

Storybook pre-edit build (`npm run build-storybook`, exit 0) + an ephemeral, non-repo Playwright probe (session
scratchpad only, not part of the diff) against `patterns-mantine-listingcardpattern--default` and
`mantine-primitives-localeswitcher--default`:

| Visible artifact/state | Property | Baseline (pre-edit) | Disposition |
|---|---|---|---|
| Grid card, normal (id=1) | display / flexDirection / overflow | flex / column / hidden | preserve (Card's own unlayered CSS) |
| Grid card, archived (id=6) | filter / opacity | grayscale(1) / 0.6 | reproduce in `.archived` |
| List card, normal (id=7) | display / flexDirection / overflow | flex / row / hidden | preserve |
| List card, archived (id=12) | filter / opacity | grayscale(1) / 0.6 | reproduce in `.archived` |
| Pending spinner | animationName/-Duration/-TimingFunction/-IterationCount | spin / 1s / linear / infinite | reproduce via local `@keyframes` + `var(--motion-duration-spinner)` |
| Route shell `<main>` | min-height / paddingBottom | 748px@812h / 836px@900h; 56px@320w / 0px@1440w | preserve via Mantine `mih` |
| `AppImage`, Task 764 hover/`imageActions`, Task 765 tokens | — | — | **out of scope, byte-unmodified** (verified §7 below) |

## 4. Implementation

- `MantineListingCardPattern.tsx` — removed `'overflow-hidden'` and `'flex flex-col'` outright (measured D34-losing,
  confirmed by the baseline capture: `display`/`flexDirection`/`overflow` already come from Card unconditionally).
  Both `isArchived && 'grayscale opacity-60'` literals replaced with `isArchived && styles.archived`.
- `MantineListingCardPattern.module.css` — new `.archived { filter: grayscale(1); opacity: 0.6; }`, wrapped in
  `@layer utilities` per D34 (Card sets neither property, so this was never a cascade-winner fight — the rule
  reproduces the removed utility's own Tailwind layer, unlike `.card`/`.listRow`/`.cardGrid` which stay unlayered
  because those *were* measured cascade winners). Module header's D34-losing section updated to reflect that two of
  the three previously-documented dead utilities are now removed, not left in place.
- `LocaleSwitcher.tsx` + new `LocaleSwitcher.module.css` — `Loader2` keeps `size={12}`; `className="animate-spin"`
  -> `className={styles.pendingIcon}`. New module: local `@keyframes localeSwitcherSpin { to { transform:
  rotate(1turn); } }`, `.pendingIcon { animation: localeSwitcherSpin var(--motion-duration-spinner) linear
  infinite; }`.
- `globals.css` — exactly one new line in the Task 765 `:root` block: `--motion-duration-spinner: 1s;` (the other
  seven lines in that block are byte-unchanged; diffed).
- `src/app/[locale]/layout.tsx` — `className="min-h-[calc(100vh-4rem)]"` -> `mih="calc(100vh - 4rem)"`; the trailing
  `design-tokens-allow:` comment deleted with it (not moved).

## 5. New gate — `check:homepage-literal-utilities`

`scripts/check-homepage-literal-utilities.mjs`, TypeScript-compiler-API AST scan (`import ts from 'typescript'`,
same convention as `scripts/check-story-coverage.mjs`) over exactly the three named files. No comment marker, no
allowlist file, no exemption path. Registered as `npm run check:homepage-literal-utilities`.

**Revision 5 model change (2026-08-25):** this section previously carried one plant-by-plant table per revision.
Revision 5 replaces `collectLiterals()` (a node-kind list) with `foldClassExpression()` (a five-rule evaluator —
full text in the script header, `scripts/check-homepage-literal-utilities.mjs:1-130`, the single source of truth,
kept current with the code on every revision) and replaces those per-revision tables with the R18 corpus below: one
evidence set that re-verifies every previously-documented plant is unchanged, then proves the new model against
forms no prior revision's plants ever tried. Revisions 1–4's own historical narrative (what each found, why the
model was wrong) stays exactly where it already lives — the top-of-file Revision 1–4 notes — and is not repeated
here.

**§4 boundary, reproduced verbatim (kickoff §6 amendment and script header carry the same text):**

> The gate folds a class expression to a static string only through bindings whose value the language itself
> fixes: a simple `const` with an initializer. `let`, `var`, parameters, destructured bindings, imports and
> catch bindings are **opaque by design** — each may hold a different value at the use site than at the
> declaration, and this gate does not guess at mutable state. This is a semantic boundary, not an unimplemented
> node kind: `let C = 'flex'; className={C}` is **not** reported, deliberately and permanently. Everything that
> is statically derivable through immutable bindings is reported; nothing that requires reasoning about
> reassignment is.

**R18 corpus — every form actually planted individually, run through the real script, and reverted, with the real
unpiped exit code. Plant site: `MantineListingCardPattern.tsx` grid `cn()` call (`:313`, replacing
`isArchived && styles.archived,`) unless noted; `LocaleSwitcher.tsx`'s `className={className}` (`:54`) and
`layout.tsx`'s `<Box>` (`:50`) are the other two sites used, exactly as in Revisions 1–4.**

**R18.1 — every Revision 1–4 form, re-verified unchanged (10 positive, 11 negative = 21):**

| # | Shape | Result |
|---|---|---|
| 1 | `cn(s.card, { 'grayscale opacity-60': isArchived })` | `❌ MantineListingCardPattern.tsx:313 — "grayscale opacity-60" (cn() argument)` `EXIT_CODE=1` |
| 2 | `` className={`flex flex-col ${cls}`} `` | `❌ LocaleSwitcher.tsx:54 — "\`flex flex-col ${className}\`" (JSX className attribute expression)` `EXIT_CODE=1` |
| 3 | `cn(['overflow-hidden'])` | `❌ MantineListingCardPattern.tsx:313 — "overflow-hidden" (cn() argument)` `EXIT_CODE=1` |
| 4 | `isArchived \|\| 'opacity-60'` | `❌ MantineListingCardPattern.tsx:313 — "opacity-60" (cn() argument)` `EXIT_CODE=1` |
| 5 | same-block `const` indirection | `❌ LocaleSwitcher.tsx:56 — "grayscale opacity-60" [declared at :49]` `EXIT_CODE=1` |
| 6 | `cx('animate-spin')` | `❌ LocaleSwitcher.tsx:54 — "animate-spin" (cx() argument)` `EXIT_CODE=1` |
| 7 | `classNames={{ root: 'min-h-screen' }}` | `❌ layout.tsx:50 — "min-h-screen" (Mantine classNames prop value)` `EXIT_CODE=1` |
| 8 | `cond ? 'a' : 'b'` | `❌ 2 found: "a", "b" (JSX className attribute expression)` `EXIT_CODE=1` |
| 9 | computed key via identifier (`{ [LOCAL_CLS]: cond }`) | `❌ LocaleSwitcher.tsx:56 — "overflow-hidden" (cn() argument) [declared at :49]` `EXIT_CODE=1` |
| 10 | `for` shadow, positive (`for (const C = 'overflow-hidden'; …)`) | `❌ LocaleSwitcher.tsx:52 — "overflow-hidden" [declared at inner :51, not outer]` `EXIT_CODE=1` |
| n1 | `className={styles.x}` | `✅ 0 static class literals` `EXIT_CODE=0` |
| n2 | `overlay.className` | `✅ 0 static class literals` `EXIT_CODE=0` |
| n3 | `` `${cls}` `` (no literal text) | `✅ 0 static class literals` `EXIT_CODE=0` |
| n4 | `classNames={{ root: styles.x }}` | `✅ 0 static class literals` `EXIT_CODE=0` |
| n5 | `const` with non-literal initializer | `✅ 0 static class literals` `EXIT_CODE=0` |
| n6 | function parameter shadows outer `const` | `✅ 0 static class literals` `EXIT_CODE=0` |
| n7 | destructured rename (`const { C: local } = …`) | `✅ 0 static class literals` `EXIT_CODE=0` |
| n8 | same-name destructuring (`const { C } = …`) | `✅ 0 static class literals` `EXIT_CODE=0` |
| n9 | `catch (C)` shadow | `✅ 0 static class literals` `EXIT_CODE=0` |
| n10 | nested `var C` shadow (`if (…) { var C = … }`) | `✅ 0 static class literals` `EXIT_CODE=0` |
| n11 | `var` in `for` body, used after the loop | `✅ 0 static class literals` `EXIT_CODE=0` |

Every row above matches its Revision 1–4 result exactly — no regression from replacing `collectLiterals()` with
`foldClassExpression()`.

**R18.2 — the five newly-covered forms (§2), each planted individually, each `EXIT_CODE=1`:**

| # | Shape | Result |
|---|---|---|
| 22 | `cn('flex flex-col' as const)` | `❌ MantineListingCardPattern.tsx:313 — "flex flex-col" (cn() argument)` |
| 23 | `cn('flex' satisfies string)` | `❌ MantineListingCardPattern.tsx:313 — "flex" (cn() argument)` |
| 24 | `cn(...['overflow-hidden'])` | `❌ MantineListingCardPattern.tsx:313 — "overflow-hidden" (cn() argument)` |
| 25 | `cn('flex ' + 'flex-col')` | `❌ MantineListingCardPattern.tsx:313 — "'flex ' + 'flex-col'" (cn() argument)` |
| 26 | `cn((0, 'animate-spin'))` | `❌ MantineListingCardPattern.tsx:313 — "animate-spin" (cn() argument)` |

**R18.3 — rule-level cases (§4/§9.3 probing that the rules are rules, not a second list):**

| # | Shape | Result |
|---|---|---|
| 27 | `<T>'flex'` | **Cannot be planted as stated** — see below |
| 28 | `cn('animate-spin'!)` | `❌ MantineListingCardPattern.tsx:313 — "animate-spin" (cn() argument)` `EXIT_CODE=1` |
| 29 | `cond ? ('a' as const) : 'b'` | `❌ 2 found: "a", "b" (cn() argument)` `EXIT_CODE=1` — two findings, Rule 2's union confirmed with a Rule-1 wrapper on one branch |
| 30 | `'flex ' + String(isArchived)` (left literal, right dynamic) | `❌ MantineListingCardPattern.tsx:315 — "'flex ' + String(isArchived)" (cn() argument)` `EXIT_CODE=1` |
| 31 | `String(isArchived) + ' flex'` (left dynamic, right literal) | `❌ MantineListingCardPattern.tsx:315 — "String(isArchived) + ' flex'" (cn() argument)` `EXIT_CODE=1` |
| 32 | `cn(...ARR)`, `const ARR = ['overflow-hidden']` (module scope) | `❌ MantineListingCardPattern.tsx:315 — "overflow-hidden" (cn() argument) [declared at :9]` `EXIT_CODE=1` — spread through Rule 5 identifier resolution into Rule 4's array recursion |
| 33 | `cn(...ARR.filter(Boolean))` (spread of neither an array literal nor a bare identifier) | `✅ 0 static class literals` `EXIT_CODE=0` |
| 34 | `cn({ ['a' + 'b']: isArchived })` | `❌ MantineListingCardPattern.tsx:315 — "'a' + 'b'" (cn() argument)` `EXIT_CODE=1` — computed key folded through Rule 3 |
| 35 | `classNames={{ root: undefined ?? 'min-h-screen' }}` | `❌ layout.tsx:50 — "min-h-screen" (Mantine classNames prop value)` `EXIT_CODE=1` |

Row 27 — `<T>'flex'`: **the brief's own form is untestable as written.** All three target files are parsed with
`ts.ScriptKind.TSX` (hardcoded in `scanFile()`/`explainFile()`, regardless of file extension), and TypeScript's
grammar disallows angle-bracket type assertions in TSX to avoid ambiguity with JSX — `ts.createSourceFile('t.tsx',
"const x = <T>'flex flex-col'", ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)` produces a malformed `JsxElement`
with 2 parse diagnostics, never a `TypeAssertionExpression`. Confirmed by planting `className={<string>'animate-
spin'}` in `LocaleSwitcher.tsx`: `EXIT_CODE=0`, silently — no crash, no diagnostic surfaced, the evaluator's
`default` case simply classifies the malformed JSX node as dynamic. `foldClassExpression`'s `TypeAssertionExpression`
branch (Rule 1) is implemented per the brief's instruction and is correct code, but it is unreachable through any of
the three guarded files and cannot be corpus-proven here. This is a defect in the brief, not the implementation —
recorded in the completion report.

**R18.4 — declared-opaque forms (§4's intended boundary, not a gap):**

| # | Shape | Result |
|---|---|---|
| 36 | module-scope `let C = 'animate-spin'; className={C}` | `✅ 0 static class literals` `EXIT_CODE=0` — intended: `let` is opaque by design (§4) |
| 37 | module-scope `var C = 'animate-spin'; className={C}` | `✅ 0 static class literals` `EXIT_CODE=0` — intended: `var` is opaque by design (§4) |

**R18.5 — permitted forms:** `styles.card` (n1), `className={className}` (the real, unmodified baseline — every
AC15 run below), `overlay.className` (n2), `` `${c}` `` (n3), `classNames={{ root: styles.x }}` (n4) — all already
proven exit 0 in R18.1; not re-planted as separate rows.

**Adversarial probing (§9.3), found and fixed in this revision, not deferred:**

| # | Shape | Result |
|---|---|---|
| 38 | `` className={`${'flex' + ' flex-col'}`} `` — a literal composed entirely inside a template substitution | **Before the fix:** `✅ 0 static class literals` `EXIT_CODE=0` (wrong — a hole of the exact shape this revision exists to close). **After the fix** (`TemplateExpression` now also folds each span's own expression, not just head/span text): `❌ LocaleSwitcher.tsx:54 — "\`${'flex' + ' flex-col'}\`" (JSX className attribute expression)` `EXIT_CODE=1` |
| — | Regression check: `` `${className}` `` (n3, unresolved identifier substitution) after the fix | `✅ 0 static class literals` `EXIT_CODE=0` — unchanged, the permitted boundary holds |
| — | Regression check: `` `flex flex-col ${className}` `` (Row 2, head text present) after the fix | `❌ LocaleSwitcher.tsx:54 — "\`flex flex-col ${className}\`"` `EXIT_CODE=1` — unchanged |
| — | Two-hop `const` chain: `const BASE_CLS = 'overflow-hidden'; const ALIAS_CLS = BASE_CLS; className={ALIAS_CLS}` | `❌ LocaleSwitcher.tsx:57 — "overflow-hidden" [declared at :18]` `EXIT_CODE=1` — §4's boundary held; Rule 5 recurses through chained `const` bindings correctly |

No other hole was found under adversarial probing. §4's boundary — a mutable binding is always opaque, however it
is reached — held against every identifier/binding-shaped probe tried.

**41 corpus rows total** (21 + 5 + 9 + 2 + 4 adversarial, `<T>x` counted as documented-not-planted): every plantable
row was actually planted, run, and reverted individually, with the real unpiped exit code recorded above. After the
last revert:

```
git --no-optional-locks diff --stat 846113faa -- src/design-system/mantine/patterns/MantineListingCardPattern.tsx src/components/shared/LocaleSwitcher.tsx "src/app/[locale]/layout.tsx"
 src/app/[locale]/layout.tsx                                      | 2 +-
 src/components/shared/LocaleSwitcher.tsx                         | 3 ++-
 src/design-system/mantine/patterns/MantineListingCardPattern.tsx | 6 ++----
 3 files changed, 5 insertions(+), 6 deletions(-)
```

Identical to every prior revision's post-revert diff — no residue from any of the 40 plants in this revision.

**AC15 — the evaluator on the real, unmodified post-766 tree, before, during, and after the full corpus:**

```
node scripts/check-homepage-literal-utilities.mjs
-> ✅ check:homepage-literal-utilities — 0 static class literals across 3 guarded files.
EXIT_CODE=0
```

Run repeatedly through the session (before the first plant, after the header-fix mid-session, after the last
revert) — identical every time.

**AC16 — `--explain` output for all three target files, run after the final revert:**

```
node scripts/check-homepage-literal-utilities.mjs --explain src/design-system/mantine/patterns/MantineListingCardPattern.tsx
-> --explain src/design-system/mantine/patterns/MantineListingCardPattern.tsx — 40 inspected site(s):
   (all 40 sites classified dynamic — styles.* module identifiers, &&-guarded module identifiers, overlay.className)
-> EXIT_CODE=0

node scripts/check-homepage-literal-utilities.mjs --explain src/components/shared/LocaleSwitcher.tsx
-> --explain src/components/shared/LocaleSwitcher.tsx — 2 inspected site(s):
     src/components/shared/LocaleSwitcher.tsx:54 (JSX className attribute expression) — dynamic
       source: {className}
     src/components/shared/LocaleSwitcher.tsx:56 (JSX className attribute expression) — dynamic
       source: {styles.pendingIcon}
-> EXIT_CODE=0

node scripts/check-homepage-literal-utilities.mjs --explain "src/app/[locale]/layout.tsx"
-> --explain src/app/[locale]/layout.tsx — 0 inspected site(s):
-> EXIT_CODE=0
```

`layout.tsx` has zero inspected sites: its `<Box>` uses the `mih` prop, not `className`/`classNames`, since
Revision 1's own product change. All three transcripts retained in full in the session evidence.

**Revision 5.1 — S1–S10, the spread-invariant corpus, each planted individually, real unpiped exit codes, each
reverted before the next:**

| ID | Form | Result |
|---|---|---|
| S1 | `cn(...'overflow-hidden')` | `✅ 0 static class literals` `EXIT_CODE=0` |
| S2 | `const S = 'overflow-hidden'; cn(...S)` | `✅ 0 static class literals` `EXIT_CODE=0` |
| S3 | `cn(...('overflow-hidden' as const))` | `✅ 0 static class literals` `EXIT_CODE=0` |
| S4 | `cn(...overlay.list)` (member expression, standing in for `props.list`) | `✅ 0 static class literals` `EXIT_CODE=0` |
| S5 | `const ARR = ['overflow-hidden']; cn(...ARR.filter(Boolean))` | `✅ 0 static class literals` `EXIT_CODE=0` |
| S6 | `const ARR_A = ARR_B; const ARR_B = ARR_A; cn(...ARR_B)` (cyclic alias) | `✅ 0 static class literals` `EXIT_CODE=0` — no hang, no crash, completed instantly |
| S7 | `cn(...['overflow-hidden'])` | `❌ MantineListingCardPattern.tsx:315 — "overflow-hidden" (cn() argument)` `EXIT_CODE=1` |
| S8 | `const ARR = ['overflow-hidden']; cn(...ARR)` | **First draft (defect found and fixed in this revision):** `❌ MantineListingCardPattern.tsx:9 — "overflow-hidden" ... [declared at :9]` `EXIT_CODE=1` — wrong, reported at the array's own declaration line, not the use site. **After the use-site fix:** `❌ MantineListingCardPattern.tsx:315 — "overflow-hidden" (cn() argument) [declared at :9]` `EXIT_CODE=1` — correct |
| S9 | `const ARR_A = ['overflow-hidden']; const ARR_B = ARR_A; cn(...ARR_B)` | `❌ MantineListingCardPattern.tsx:316 — "overflow-hidden" (cn() argument) [declared at :9]` `EXIT_CODE=1` — declaration line attributed to `ARR_A` (the array's own declaration), not `ARR_B` (the alias) |
| S10 | `cn(...(['overflow-hidden'] as const))` | `❌ MantineListingCardPattern.tsx:313 — "overflow-hidden" (cn() argument)` `EXIT_CODE=1` |

S7's regression re-run after the S8 fix confirmed unchanged (`EXIT_CODE=1`, same literal, no `declLine` — a direct
array literal has no alias to attribute).

**Full re-run, entire Revision 5 R18 corpus (41 rows) against the Revision 5.1 evaluator — every result unchanged.**
Rows 24 (`cn(...['overflow-hidden'])`), 32 (`cn(...ARR)`), and 33 (`cn(...ARR.filter(Boolean))`) are the exact same
AST shapes as S7, S8, and S5 respectively and are not separately re-planted; all other 38 rows were individually
planted, run, and reverted:

| Row | Result |
|---|---|
| 1 (clsx object key) | `❌ MantineListingCardPattern.tsx:313 — "grayscale opacity-60"` `EXIT_CODE=1` |
| 2 (template, head text) | `❌ LocaleSwitcher.tsx:54 — "\`flex flex-col ${className}\`"` `EXIT_CODE=1` |
| 3 (array literal) | `❌ MantineListingCardPattern.tsx:313 — "overflow-hidden"` `EXIT_CODE=1` |
| 4 (`\|\|`) | `❌ MantineListingCardPattern.tsx:313 — "opacity-60"` `EXIT_CODE=1` |
| 5 (same-block const indirection) | `❌ LocaleSwitcher.tsx:56 — "grayscale opacity-60" [declared at :49]` `EXIT_CODE=1` |
| 6 (`cx()`) | `❌ LocaleSwitcher.tsx:54 — "animate-spin"` `EXIT_CODE=1` |
| 7 (classNames literal) | `❌ layout.tsx:50 — "min-h-screen"` `EXIT_CODE=1` |
| 8 (ternary both branches) | `❌ 2 found: "a", "b"` `EXIT_CODE=1` |
| 9 (computed key via identifier) | `❌ LocaleSwitcher.tsx:56 — "overflow-hidden" [declared at :49]` `EXIT_CODE=1` |
| 10 (`for` shadow, positive) | `❌ LocaleSwitcher.tsx:52 — "overflow-hidden" [declared at inner :51]` `EXIT_CODE=1` |
| 22 (`as const`) | `❌ MantineListingCardPattern.tsx:313 — "flex flex-col"` `EXIT_CODE=1` |
| 23 (`satisfies`) | `❌ MantineListingCardPattern.tsx:313 — "flex"` `EXIT_CODE=1` |
| 25 (`+` both literal) | `❌ MantineListingCardPattern.tsx:313 — "'flex ' + 'flex-col'"` `EXIT_CODE=1` |
| 26 (comma) | `❌ MantineListingCardPattern.tsx:313 — "animate-spin"` `EXIT_CODE=1` |
| 28 (`!` on literal) | `❌ MantineListingCardPattern.tsx:313 — "animate-spin"` `EXIT_CODE=1` |
| 29 (ternary with `as const` branch) | `❌ 2 found: "a", "b"` `EXIT_CODE=1` |
| 30 (`'flex ' + dynamic`) | `❌ MantineListingCardPattern.tsx:313 — "'flex ' + String(isArchived)"` `EXIT_CODE=1` |
| 31 (`dynamic + ' flex'`) | `❌ MantineListingCardPattern.tsx:313 — "String(isArchived) + ' flex'"` `EXIT_CODE=1` |
| 34 (computed key via `+`) | `❌ MantineListingCardPattern.tsx:313 — "'a' + 'b'"` `EXIT_CODE=1` |
| 35 (classNames via `??`) | `❌ layout.tsx:50 — "min-h-screen"` `EXIT_CODE=1` |
| 36 (module `let`) | `✅ 0 static class literals` `EXIT_CODE=0` |
| 37 (module `var`) | `✅ 0 static class literals` `EXIT_CODE=0` |
| 38 (template substitution composition) | `❌ LocaleSwitcher.tsx:54 — "\`${'flex' + ' flex-col'}\`"` `EXIT_CODE=1` |
| n1 (`styles.x`) | `✅ 0 static class literals` `EXIT_CODE=0` |
| n2 (`overlay.className`) | `✅ 0 static class literals` `EXIT_CODE=0` |
| n3 (`${cls}`, no text) | `✅ 0 static class literals` `EXIT_CODE=0` |
| n4 (`classNames={{ root: styles.x }}`) | `✅ 0 static class literals` `EXIT_CODE=0` |
| n5 (const, non-literal) | `✅ 0 static class literals` `EXIT_CODE=0` |
| n6 (parameter shadow) | `✅ 0 static class literals` `EXIT_CODE=0` |
| n7 (destructured rename) | `✅ 0 static class literals` `EXIT_CODE=0` |
| n8 (same-name destructuring) | `✅ 0 static class literals` `EXIT_CODE=0` |
| n9 (`catch` shadow) | `✅ 0 static class literals` `EXIT_CODE=0` |
| n10 (nested `var` shadow) | `✅ 0 static class literals` `EXIT_CODE=0` |
| n11 (`var` in `for` body) | `✅ 0 static class literals` `EXIT_CODE=0` |
| two-hop `const` chain (adversarial) | `❌ LocaleSwitcher.tsx:57 — "overflow-hidden" [declared at :18]` `EXIT_CODE=1` |

`TypeAssertionExpression` (`<T>x`) remains documented as untestable in `.tsx` (Revision 5 §5, row 27) — not silently
dropped from Rule 1; the evaluator branch is still present and correct, only unreachable through the three guarded
files.

Post-revert integrity, all three target files against the submitted commit `846113faa`:

```
git --no-optional-locks diff --stat 846113faa -- src/design-system/mantine/patterns/MantineListingCardPattern.tsx src/components/shared/LocaleSwitcher.tsx "src/app/[locale]/layout.tsx"
 src/app/[locale]/layout.tsx                                      | 2 +-
 src/components/shared/LocaleSwitcher.tsx                         | 3 ++-
 src/design-system/mantine/patterns/MantineListingCardPattern.tsx | 6 ++----
 3 files changed, 5 insertions(+), 6 deletions(-)
```

Identical to every prior revision's post-revert diff — no residue from any of the 10 S-corpus plants or the 38
re-planted regression rows in this revision.

## 6. Route-shell probe (AC5) — `scripts/task766-route-shell-probe.mjs`

Modelled on `scripts/task764-pointer-probe.mjs` (per-label retained JSON) and `scripts/check-click-shield.mjs`
(`BASE_URL` env default, `<nextjs-portal>` dev-server refusal). Navigates `/en` at pinned `320x812` and `1440x900`,
reads `getComputedStyle(document.querySelector('main'))`, walks the CSSOM (recursing `@layer`/`@media`/`@supports`)
to name which rule supplies `min-height`.

**Bug found and fixed during this session:** the first version's CSSOM walker used `if (rule.cssRules) { recurse;
continue; }`, which — under Chromium's native CSS Nesting support — treats every `CSSStyleRule` as a container
(it always exposes a `.cssRules`, empty or not) and so skipped every leaf rule's own selector/style check entirely,
always returning `"unresolved"`. Fixed by checking the leaf condition unconditionally and only recursing when
`rule.cssRules.length > 0`. Reproduced and confirmed via three isolated debug scripts before patching the real
probe (see transcript below); the debug scripts were deleted, not committed.

Sequence run exactly per kickoff §13.1 (native PowerShell/Bash, platform confirmed `win32` at I0):

```
npm.cmd run build                              -> exit 0 (pre-edit)
(next start on :3000, curl -> 200)
BASE_URL=http://127.0.0.1:3000 node scripts/task766-route-shell-probe.mjs pre-edit
  320x812:  minHeight=748px  paddingBottom=56px  display=block
            resolvedFrom = ".min-h-\[calc\(100vh-4rem\)\] { min-height: calc(-4rem + 100vh) }"
  1440x900: minHeight=836px paddingBottom=0px   display=block
            resolvedFrom = same Tailwind rule
  -> exit 0 (all cells captured cleanly)
(server stopped)

[implementation applied]

npm.cmd run build                              -> exit 0 (post-edit)
(next start on :3000, curl -> 200)
BASE_URL=http://127.0.0.1:3000 node scripts/task766-route-shell-probe.mjs post-edit
  320x812:  minHeight=748px  paddingBottom=56px  display=block
            resolvedFrom = "inline style: min-height: calc(-4rem + 100vh)"
  1440x900: minHeight=836px paddingBottom=0px   display=block
            resolvedFrom = same inline style
  -> exit 0
(server stopped)
```

`minHeight`/`paddingBottom`/`display` are byte-identical pre/post at both viewports; `resolvedFrom` flips from the
Tailwind utility rule to Mantine's own inline `min-height` style. **Revision 1 correction (2026-08-25):** the probe's
`resolveMinHeightSourceInPage()` (`scripts/task766-route-shell-probe.mjs:97`) returns `matches[matches.length - 1]`
— the **last matching rule in document order**, plus an inline-style short-circuit — not a cascade resolver: it
computes no specificity, no cascade-layer order, and no `!important`. It is nonetheless correct for this diff,
because pre-edit exactly one rule in the built stylesheet set `min-height` on `main`, and post-edit the element's own
inline style short-circuits before any rule walk happens at all — so there is no ambiguity for the heuristic to get
wrong here. `className` no longer contains the Tailwind literal (confirmed in both JSON artifacts). `design-tokens-allow:` marker absent from the source, the diff, and `scripts/design-tokens-allowlist.json`
(diffed against `7b9a13c37` — untouched). Both artifacts retained: `docs/sessions/evidence/task766/route-shell.
pre-edit.json`, `route-shell.post-edit.json`.

## 7. AppImage / Task 764 / Task 765 byte-equality (AC8, §8 scope)

```
git --no-optional-locks diff --stat 7b9a13c37 -- src/components/ui/AppImage.tsx src/components/ui/appImageConfig.ts \
  src/components/ui/AppImage.module.css src/design-system/mantine/patterns/MantineListingCardPattern.module.css
-> only MantineListingCardPattern.module.css listed (30 insertions / 8 deletions); the three AppImage files are
   ABSENT from the stat output, i.e. byte-unmodified.
```

Diffed the Task 764 hover/`imageActions` block specifically: `git diff 7b9a13c37 -- ...module.css | grep
"cardGrid:hover\|imageActions {"` -> no output, i.e. none of those lines appear in the diff at all.

`git diff --stat 7b9a13c37` (full): `docs/backlog.md`, `package.json` (+1, the new npm script), `layout.tsx` (+1/-1),
`globals.css` (+1), `LocaleSwitcher.tsx` (+2/-1), `MantineListingCardPattern.module.css` (+30/-8),
`MantineListingCardPattern.tsx` (+3/-3), plus the two pre-existing docs files from the filing commit. `globals.css`
shows exactly one added line, zero removed.

## 8. Rendered/computed evidence (post-edit)

Storybook post-edit build (exit 0) + the same ephemeral probe:

| Cell | display | flexDirection | overflow | filter | opacity | cardRect | imgRect |
|---|---|---|---|---|---|---|---|
| Grid normal (1) | flex | column | hidden | none | 1 | 320x367.02 | 318x180 |
| Grid archived (6) | flex | column | hidden | grayscale(1) | 0.6 | 320x367.02 | 318x180 |
| List normal (7) | flex | row | hidden | none | 1 | 992x182 | 176x180 |
| List archived (12) | flex | row | hidden | grayscale(1) | 0.6 | 992x182 | 176x180 |

All identical to the pre-edit baseline in §3. Archived class name changed from `grayscale opacity-60` to
`_archived_17o8d_74` (CSS Module hash), as expected.

Pending spinner: `animationDuration=1s`, `-TimingFunction=linear`, `-IterationCount=infinite` — identical pre/post.
`animationName` changed from Tailwind's `spin` to the local `_localeSwitcherSpin_1wpyj_1` — expected (new local
keyframe, not Tailwind's compiled one). `pendingButtonDisabled: true` in both runs. Icon `getBoundingClientRect()`
width/height differed between the two captures (14.23px pre vs 15.12px post) — this is **not** a size regression:
`Loader2`'s `size={12}` prop is unchanged in the diff (confirmed above), and a continuously-rotating element's
axis-aligned bounding box varies with the rotation angle at the instant of capture (a 12x12 square's bounding box
ranges from 12px at 0/90/180/270 degrees to ~16.97px at 45 degrees) — the two captures simply landed at different
points in the infinite animation. The static SVG geometry (`size={12}` attribute) is unaffected and unchanged in
source.

**Reduced-motion (negative flow, §10):** grepped the built production CSS for `prefers-reduced-motion` — three
scoped rules exist (`MantineListingCardPattern`'s own Task 764 guard, Mantine `Skeleton`, Mantine's opt-in
`[data-respect-reduced-motion][data-reduce-motion]` attribute pair); none is global, and none targets
`LocaleSwitcher`'s Button/icon. The removed `animate-spin` had **no** reduced-motion guard, and `.pendingIcon`
likewise has none — parity preserved. Per kickoff §14.6 this stop condition does not fire: no new guard was added.

## 9. Full command list (§13), native PowerShell/Bash, `win32` confirmed

| Command | Exit | Notes |
|---|---|---|
| `npm.cmd run check:homepage-literal-utilities` | 0 | 0 literals, post-plant-revert clean run |
| `npm.cmd run check:tailwind-runtime-tokens` | 0 | baseline unchanged at 14, 0 new debt |
| `npm.cmd run check:design-tokens` (`--strict`) | 0 | 0 violations, 0 stale-markers |
| `npm.cmd run check:css-vars` | 0 | 0 violations, 0 in-class dynamic sites |
| `npx tsc --noEmit` | 0 | clean |
| `npm.cmd run build` | 0 | run twice (pre-edit + post-edit), both clean |
| `npm.cmd run build-storybook` | 0 | run twice (pre-edit + post-edit) |
| `npm.cmd run check:stories` | 0 | 129 files, 0 violations |
| `npm.cmd run screenshots:responsive:storybook` | 0 | 293/296 captured; 3 unrelated timeouts on `System/RecentlyViewedSection` (not a Task 766 file/story). **Revision 1 note (R14.2):** this row does not cover either touched story — `scripts/responsive-screenshots.mjs` drives a fixed story-id list containing neither `patterns-mantine-listingcardpattern--default` nor `mantine-primitives-localeswitcher--default` (confirmed by grep, 0 matches). This row is not evidence for AC2–AC4; the exit-0 result covers only the 296 stories the fixed list names. |
| `npm.cmd run screenshots:assert` | **1** | see §10 — real exit code, not masked |
| `npm.cmd run check:file-integrity` | 0 | 16 changed/untracked files clean |
| `npm.cmd run check:mojibake` | 0 | 3294 files, 0 artifacts |
| `BASE_URL=http://127.0.0.1:3000 npm.cmd run check:hydration` | 0 | see §11 |

## 10. `screenshots:assert` — the actual result, not the notification's shell-exit summary

**Correction made mid-session:** the background-task notification for this command reported "(exit code 0)" — that
reflects the wrapping Bash statement's own exit status (an `echo` after a `>` redirect), not `npm`'s. The real exit
code, captured separately per the agent-contract §3a discipline (`echo "EXIT_CODE=$?" >> log`, unpiped), was **1**.
Reporting the notification's number would have been the exact Task-709 mis-capture failure mode the project's own
governance docs warn about. The real result:

```
Results: 6943/8108 PASS, 847 FAIL, 108 OUT-OF-RANGE, 210 AMBIGUOUS
Inventory: docs/governance-reports/2026-06-19-task467-storybook-visual-defect-inventory.md
```

`grep -n "ListingCardPattern|LocaleSwitcher" <full log>` — **zero matches** in the failed-cells listing. Queried
`manifest.json`'s `matrix` array directly (8108 cells) for the two touched stories:

```
Mantine/Primitives/LocaleSwitcher/Default:        16/16 verdict=pass
Patterns/Mantine/ListingCardPattern/Default:       16/16 verdict=pass
```

The 847 failures are entirely in stories this task never touches (`Patterns/Mantine/AuthSheet/*`,
`Mantine/Primitives/Notification`, `Mantine/Primitives/Slider`, Admin tables, etc.) and are attributed by the
script's own summary to a pre-existing, dated defect inventory (2026-06-19, well before this task existed). I did
not run a full pre-edit `screenshots:assert` to formally diff the 847 baseline — that was not part of the kickoff's
required evidence path (§13.1 exists specifically because this command cannot observe the route-shell change, and
the kickoff's own measure-first requirement for the card/spinner was satisfied by the narrower computed-style probe
in §3/§8).

**Revision 1 — the pixel evidence that actually closes the gap (R14.1, 2026-08-25).** Both `.screenshots/rendered-
assert/2026-08-24T10-16` (pre-change) and `2026-08-24T21-08` (post-run) retain all 32 PNGs of the two touched
stories (16 cells each — 4 locales × desktop-1024/mobile-320/mobile-375/mobile-390, minus the missing combos
absorbed by the fixed matrix). MD5-compared every one:

```
cd .screenshots/rendered-assert
for f in 2026-08-24T10-16/patterns-mantine-listingcardpattern--default__*.png 2026-08-24T10-16/mantine-primitives-localeswitcher--default__*.png; do
  base=$(basename "$f")
  pre_md5=$(md5sum "2026-08-24T10-16/$base" | cut -d' ' -f1)
  post_md5=$(md5sum "2026-08-24T21-08/$base" | cut -d' ' -f1)
  if [ "$pre_md5" = "$post_md5" ]; then echo "MATCH $base $pre_md5"; else echo "DIFFER $base pre=$pre_md5 post=$post_md5"; fi
done
```

Result: **32 MATCH, 0 DIFFER** — every PNG of both stories is byte-identical (MD5-identical) between the pre-change
and post-run captures. (Sample rows: `MATCH patterns-mantine-listingcardpattern--default__en__desktop-1024.png
3157e9fef3a74cc4991cbfd5c4f3c729`; `MATCH mantine-primitives-localeswitcher--default__en__desktop-1024.png
cc87df80ec88fa750f3fd977e35aad50`; full 32-row transcript retained in the review session.)

Manifest query, `2026-08-24T21-08/manifest.json` (8108 total cells), re-run independently:

```
ListingCardPattern cells: 16 pass: 16
LocaleSwitcher cells: 96 pass: 96
```

**Restated conclusion:** the two in-scope stories are 100% pass in `screenshots:assert`, and — the fact that closes
this gap — their 32 rendered PNGs (`ListingCardPattern`'s 16 cells) are pixel-identical, not merely both-passing,
between the pre-change and post-run captures; `LocaleSwitcher`'s full 96-cell story set is likewise 100% pass. The
missing full pre-edit `screenshots:assert` baseline diff is closed **by byte-identical target-story pixels**, not by
the two story names' absence from the 847-entry failure list (absence from a failure list is necessary but not
sufficient; byte-identical pixels is sufficient). The 847-failure disclosure above is kept as originally written —
it remains true and unattributable to this diff by the same direct evidence (neither touched file/component appears
anywhere in the failure list).

## 11. Critical-flow registry — `LocaleSwitcher.tsx` row

`docs/critical-flow-registry.md` row "Header overlays (locale switch...)" names `LocaleSwitcher.tsx` and its
required command `BASE_URL=... npm run check:hydration`. Ran it against the post-edit production server:

```
Checking Homepage (en) … PASS
Checking Listings list (en) … PASS
Checking Homepage (sq/Albanian) … PASS
Checking Homepage (uk/Ukrainian) … PASS
PASS: 4  FAIL: 0  SKIP: 3 (authenticated cells — no session provided, documented NOT-REAL-COVERAGE, not a failure)
EXIT_CODE=0
```

Only the unauthenticated public-route cells ran (no captured session available in this session); the authenticated
cells are the gate's own documented skip condition, not new to this task.

## 12. Files Changed

**Revision 1 note (R14.4):** removing `overflow-hidden`/`flex flex-col` (row 1 below) leaves the card's
`display`/`flexDirection`/`overflow` sourced entirely from the pinned `@mantine/core` 8.3.18 dependency, with no
gate guarding it after this diff — see §14's future-risk note for the full statement.

| File | Reason |
|---|---|
| `src/design-system/mantine/patterns/MantineListingCardPattern.tsx` | Removed 2 dead Tailwind literals, replaced 2 archived literals with `styles.archived` |
| `src/design-system/mantine/patterns/MantineListingCardPattern.module.css` | New `.archived` rule (`@layer utilities`); updated header doc for the 2 removed dead utilities |
| `src/components/shared/LocaleSwitcher.tsx` | `animate-spin` -> `styles.pendingIcon`; new module import |
| `src/components/shared/LocaleSwitcher.module.css` | New file — local keyframe + `.pendingIcon` |
| `src/app/globals.css` | +1 line: `--motion-duration-spinner: 1s` |
| `src/app/[locale]/layout.tsx` | `className` -> Mantine `mih` prop; marker comment deleted |
| `scripts/check-homepage-literal-utilities.mjs` | New AST gate (R8); **Revision 1:** widened traversal (R11/R12), corrected header (R13); **Revision 2:** computed clsx object keys resolved through identifier indirection, same-file `const` resolution rewritten from a flat file-wide map to a block/source-file scan; **Revision 3:** `resolveIdentifierLexically()` rewritten again to walk real JS/TS runtime bindings (`for`/`for-in`/`for-of` declarations, `catch` bindings, destructured declarations by binding-kind not by name, function/method parameters, `import`s, function/class names, `switch` scope) instead of only scanning `Block`/`SourceFile` `VariableStatement`s; **Revision 4:** added `collectHoistedVarNames()` — `var` is now resolved by its true function/source hoisting scope (collected from every descendant block/loop/`catch`, never descending into a nested function/class) instead of only the exact block a use-site's climb passes through, header corrected to match; **Revision 5 (R16/R17):** `collectLiterals()` (a node-kind list) replaced by `foldClassExpression()`, a five-rule evaluator over runtime semantics — value-preserving wrappers, branching, `+`/comma composition, array/spread/object aggregation, and Rule 5's unchanged `const`-only binding fold — ending in one explicit `default: return DYNAMIC`; `--explain <file>` mode added; `resolveIdentifierLexically()` and its helpers untouched; a template-substitution composition hole found by this revision's own adversarial pass (§9.3) fixed in the same revision; header rewritten as the five rules plus the fail-open note and §4's boundary statement verbatim; **Revision 5.1:** added `resolveSpreadArrayLiteral()` — Rule 4's `SpreadElement` handling rewritten to prove the operand is an array literal (direct, transparent-wrapper, or simple `const` alias chain, cycle-guarded) before any folding, fixing a false positive where `cn(...'overflow-hidden')` was wrongly reported; a use-site-vs-declaration-line node-attribution defect found and fixed during this revision's own implementation; header's Rule 4 rewritten to state the spread invariant exactly |
| `scripts/task766-route-shell-probe.mjs` | New task-owned evidence probe (§13.1), no npm entry; **Revision 1:** document-order caveat added to header (R14.3) |
| `package.json` | +1 npm script entry |
| `docs/backlog.md` | Concise state update (this session); **Revision 1:** state updated to `NEEDS REVISION (Revision 1)` (R15); **Revision 5:** state updated to `Revision 5` (R19); **Revision 5.1:** state updated to `Revision 5.1` (all three Task 766 references) |
| `docs/sessions/2026-08-25-task766-homepage-literal-utility-exit.md` | This log; **Revision 1:** R14 evidence gaps closed; **Revision 5:** R18 corpus replaces the per-revision plant tables in §5 (R19); **Revision 5.1:** S1–S10 corpus and full 41-row R18 re-run added to §5 |
| `docs/sessions/evidence/task766/route-shell.pre-edit.json`, `route-shell.post-edit.json` | Retained probe evidence |
| `tasks/Sprints/Sprint_65_Task_766_revision_1_gate_traversal_and_failure_proof.md` | Revision 1 brief (orchestrator-authored, pre-existing on disk this session) |
| `tasks/Sprints/Sprint_65_Task_766_revision_5_class_expression_evaluator.md` | Revision 5 brief (orchestrator-authored, pre-existing on disk this session) |

## 13. Not touched (§8)

`AppImage.tsx`, `appImageConfig.ts`, `AppImage.module.css`, the Task 764 hover/`.cardGrid` scale/`imageActions` CSS,
all Task 765 `:root` lines other than the one new addition, `SaveToCollectionButton`, `AuthSheet`, `PerfDevOverlay`,
any `@import`/`@theme inline`/`@apply` in `globals.css`, translations/messages, data/API code, and no permanent or
extended Storybook story. Verified in §6-7 above by diff inspection, not asserted.

## 14. Assumptions, deviations, limitations

- **Revision 1 — `@mantine/core` 8.3.18 dependency, future-risk note (R14.4, 2026-08-25):** removing
  `overflow-hidden` and `flex flex-col` outright (§4) leaves `display`/`flexDirection`/`overflow` on the card
  sourced entirely from Mantine's own unlayered `Card.css` at a pinned version (`package.json`: `@mantine/core:
  ^8.3.18`), with no gate, story assertion, or in-code comment guarding that dependency after this diff — only the
  module header's prose (§4, "D34-losing... Card's own unlayered CSS"). This is **not a defect of Task 766**: the
  dependency was real, measured pre- and post-edit, and pinned at review (revision brief §1). It is a version-upgrade
  risk — a future `@mantine/core` bump that changes `Card`'s own `display`/`flexDirection`/`overflow` would silently
  change this card's layout with nothing in this repo positioned to catch it.
- The ephemeral Playwright computed-style probe used for §3/§8 lives only in the session scratchpad, never in the
  repo — it is not part of the diff and was deleted after each use (confirmed via `git status --short`).
- `screenshots:responsive:storybook`'s 3 failures (`System/RecentlyViewedSection`, all locale/viewport combos of
  two unrelated stories) are pre-existing timeouts, not touched by this diff.
- `screenshots:assert` exited 1 on 847 pre-existing, unrelated failures; both in-scope stories are 16/16 pass each.
  No full pre-edit baseline of this specific command was captured — see §10 for the exact gap.
- `check:hydration` ran only the unauthenticated public-route cells; no captured session was available for the
  authenticated cells, matching the gate's own existing skip semantics.

## 15. Opus handoff — questions and risks to inspect

1. Independently re-verify the `.archived` cascade-layer decision (§4) against `docs/mantine-responsive-design-
   system.md` §18 and D34: confirm `@layer utilities` is correct here (Card contests neither `filter` nor `opacity`).
2. Independently query `.screenshots/rendered-assert/2026-08-24T21-08/manifest.json` for the two target stories to
   confirm the 16/16 pass counts reported in §10 and §8.
3. Decide whether the `screenshots:assert` full-repo exit-1 result (847 pre-existing failures, none in scope) is
   acceptable evidence for this task's Q3 profile, or whether a full pre/post baseline diff should be required.
4. Verify the CSSOM-walker bug-fix in `scripts/task766-route-shell-probe.mjs` (§6) independently — it is evidence
   tooling, not a gate, but its correctness underpins the AC5 `resolvedFrom` claim.
5. AppImage/Task 764/Task 765 byte-equality (§7) — re-run the same `git diff --stat` commands independently.
