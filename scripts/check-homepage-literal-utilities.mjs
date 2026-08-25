#!/usr/bin/env node
/**
 * check-homepage-literal-utilities.mjs — Task 766 (Sprint 65, level 1) AST-based literal guard.
 * Revision 1 (Task 766-R1): widened traversal — see WHAT IT CHECKS below.
 * Revision 2 (Task 766-R2): computed clsx object keys now resolve through the same
 * identifier-indirection path as every other site (not just a direct string literal).
 * Revision 3 (Task 766-R3): same-file `const` indirection is now resolved against real JS/TS
 * runtime bindings, not just `const`/`let`/`var` declared directly in a `Block`/`SourceFile`.
 * Revision 2's resolver missed `for`/`for-in`/`for-of` declarations entirely (so a shadowing loop
 * variable was invisible and an outer same-named `const` was wrongly read through past it) and
 * treated every destructured binding sharing the target's name as if it were the plain `const` it
 * shadows (so `const { C } = props` did not stop the search). See WHAT IT CHECKS point 4 for the
 * exact binding forms now recognized.
 * Revision 4 (Task 766-R4): `var` is scoped to its whole enclosing function or the source file, not
 * to whichever nested block/`if`/loop/`catch` textually declares it — Revision 3 still checked
 * `var` only in the exact block a use-site climbed through, so a `var` declared inside a nested
 * block (e.g. `if (ready) { var C = className }`) was invisible once the use-site's own climb
 * passed that block, and the walk wrongly kept going outward to an unrelated, further-out `const`.
 * The resolver now collects every `var` hoisted into a function/source scope — from any nested
 * block/loop/`catch`, including a `for`/`for-in`/`for-of` initializer, but never descending into a
 * nested function/class body — at the point the walk reaches that function/source boundary, before
 * it is ever allowed to continue searching past it.
 * Revision 5 (Task 766-R5): the model itself was wrong, not the implementation. Four rounds each
 * closed exactly the node kinds the previous brief named — `as const`, `satisfies`, spread, `+`
 * composition and the comma operator all still passed uncaught at the end of Revision 4 — because a
 * finite list of permitted node kinds cannot satisfy a universally quantified contract ("rejects
 * *any* static class literal"). `collectLiterals()` (a node-kind list with a silent, resultless
 * fallthrough for anything unlisted) is replaced by `foldClassExpression()`, a small evaluator
 * defined by five rules over runtime semantics (WHAT IT CHECKS below), plus a `--explain` mode that
 * makes its classification of any given file auditable rather than asserted.
 * `resolveIdentifierLexically()` and everything it calls (`matchStatement`, `matchStatements`,
 * `matchDeclarationList`, `matchImportBinding`, `bindingNames`, `isFunctionLikeWithParams`,
 * `isFunctionOrClassScope`, `collectHoistedVarNames`) is unchanged from Revision 4 — it is four
 * revisions of independently-verified lexical-scope correctness and Revision 5 does not touch it.
 * Adversarial probing of Revision 5's own first draft found one more hole of the identical shape
 * the whole revision exists to close: `TemplateExpression` folding inspected only its `head`/span
 * **text**, never a substitution's own expression, so `` `${'flex' + ' flex-col'}` `` — a literal
 * composed entirely inside `${}` — passed uncaught. Fixed in the same revision, not deferred: see
 * Rule 3 below.
 * Revision 5.1 (Task 766-R5.1): Rule 4's own contract — "a `SpreadElement` yields an array literal's
 * elements; a spread of anything else is dynamic" — was violated by its shipped implementation,
 * which simply delegated a spread's operand to the general evaluator. `cn(...'overflow-hidden')`
 * spreads the string's *characters* into `cn()`, not the string itself as a class name, but the
 * general evaluator still folds a bare string literal to itself, so the old code reported
 * `"overflow-hidden"` — wrong. A spread operand is now proven to be an array literal — directly, through
 * a Rule-1 transparent wrapper around one, or through a simple `const` alias chain (cycle-guarded,
 * never a destructured/mutable binding) — by `resolveSpreadArrayLiteral()` BEFORE any folding
 * happens; only once that is established does the array's own elements get folded through the
 * normal evaluator. A spread of a string, template, object, call, member expression, or any other
 * expression that would itself fold statically stays dynamic. See Rule 4 below for the exact
 * invariant. No other rule changed; `resolveIdentifierLexically()` and its helpers remain untouched.
 *
 * BOUNDARY (state this in writing, per the kickoff §6 contract): this guards exactly THREE fixed
 * production files — it is not a route-graph inventory, and Task 667 remains the only
 * route-certification work. A clean run here proves nothing about any other file in the render
 * graph.
 *
 *   - src/design-system/mantine/patterns/MantineListingCardPattern.tsx
 *   - src/components/shared/LocaleSwitcher.tsx
 *   - src/app/[locale]/layout.tsx
 *
 * WHAT IT CHECKS: uses the TypeScript compiler API (a real AST, not a whole-file regex — comments,
 * historical names and doc text are never false positives) to inspect, in those three files only,
 * every JSX `className` attribute value, every argument to `cn(...)`/`cx(...)`/`clsx(...)`
 * (identifier callees only — no member-expression or aliased callees; `cx`/`clsx` are covered
 * **defensively**, neither call appears anywhere in `src/` today), and every Mantine
 * `classNames={{ ... }}` JSX property value (also covered defensively) — and folds each one through
 * `foldClassExpression()`, a small evaluator built from five rules over what the expression's
 * runtime value can be, not from a list of AST node kinds:
 *
 *   1. **Value-preserving wrappers are transparent.** Any node that yields its operand's runtime
 *      value unchanged folds to its operand: `ParenthesizedExpression`, `AsExpression`
 *      (`x as T`, including `as const`), `SatisfiesExpression` (`x satisfies T`),
 *      `NonNullExpression` (`x!`), `TypeAssertionExpression` (`<T>x`). These are type-only and
 *      grouping syntax with no runtime value of their own — a future TS syntax of the same nature
 *      belongs here, not in a Revision 6 list.
 *   2. **Branching yields the union of reachable operands.** `? :` folds and reports **both**
 *      branches, not only the first match. `&&` folds its right operand only (the left is a
 *      condition, not a class value). `||` and `??` fold both operands. The comma operator
 *      (`BinaryExpression` with a `,` token) folds its right operand only — that is the value the
 *      expression actually evaluates to. A form is a violation if **any** reachable branch is
 *      static.
 *   3. **Composition preserves literal chunks.** `+` folds both operands independently; if either
 *      side is itself static (by these same rules — including a whitespace-only side, which is
 *      never static per rule 6), the whole `+` expression is reported as one finding carrying its
 *      full raw source text. `TemplateExpression` is composition too and is folded the same way:
 *      it is static when its own `head`/span **text** carries non-whitespace content, OR when any
 *      substitution's own expression folds statically by these same rules (found by adversarial
 *      probing during Revision 5 itself — `` `${'flex' + ' flex-col'}` `` composes a literal
 *      entirely inside `${}`, and text-only inspection missed it exactly like the pre-Revision-5
 *      node-kind list missed `+`); either way the whole raw template text is the reported literal,
 *      never just the matching fragment. A substitution that does not itself fold statically
 *      (an unresolved identifier — `` `${cls}` `` included) still contributes nothing on its own.
 *   4. **Aggregation sites recurse into their elements.** An array literal folds every element.
 *      `SpreadElement` is narrower than every other rule here, by design: its operand must first be
 *      *proven* an array literal — directly (`cn(...['x'])`), through a Rule-1 transparent wrapper
 *      around one (`cn(...(['x'] as const))`), or through a simple non-destructured `const` alias
 *      chain whose initializer recursively resolves the same way (`const A = ['x']; const B = A;
 *      cn(...B)` attributes to `A`'s own declaration line; a cyclic alias chain is cycle-guarded and
 *      resolves to dynamic, never an infinite recursion) — **before** the general evaluator is ever
 *      invoked on the operand. Only once an array literal is established does folding recurse into
 *      its elements through the normal evaluator (preserving literal/template/nested-spread/
 *      conditional semantics and declaration-line reporting inside the array). Every other spread
 *      operand is dynamic, even one that would itself fold statically anywhere else: a string, a
 *      template, an object, a call, a member expression, a binary/conditional expression, or an
 *      identifier bound to a `let`/`var`/parameter/import/unresolved name is not an array literal
 *      for this rule — `cn(...'overflow-hidden')` spreads characters, not the string, and must never
 *      be reported. The clsx object form folds each property **key** (`StringLiteral`,
 *      `NoSubstitutionTemplateLiteral`, or a `ComputedPropertyName` folded through this same
 *      evaluator) — property values are conditions and are never folded. The Mantine `classNames`
 *      object form is the inverse: each property **value** is folded; keys are slot names and are
 *      never folded. `ShorthandPropertyAssignment` and `SpreadAssignment` inside either object form
 *      contribute nothing (dynamic).
 *   5. **Bindings fold only when the language guarantees the value.** `resolveIdentifierLexically()`
 *      finds the identifier's nearest real JS/TS runtime binding (unchanged from Revision 4 — see
 *      that function's own doc comment for the full binding-form list). If — and only if — that
 *      binding is a **simple, non-destructured** `const` with an initializer, the initializer is
 *      folded through this same evaluator, and every resulting finding is reported at the
 *      identifier's own use-site line, carrying the declaration's line alongside it. Every other
 *      binding kind (a parameter, a destructured binding however it renders, a `let`, a `var`
 *      wherever in its function/source scope it is declared, a `catch` binding, an `import`, a
 *      function/class name, or a `const` with no initializer) is opaque: the search stops there and
 *      nothing is reported, even when a further-out scope declares a same-named `const` literal.
 *
 *      > The gate folds a class expression to a static string only through bindings whose value the
 *      > language itself fixes: a simple `const` with an initializer. `let`, `var`, parameters,
 *      > destructured bindings, imports and catch bindings are **opaque by design** — each may hold
 *      > a different value at the use site than at the declaration, and this gate does not guess at
 *      > mutable state. This is a semantic boundary, not an unimplemented node kind:
 *      > `let C = 'flex'; className={C}` is **not** reported, deliberately and permanently.
 *      > Everything that is statically derivable through immutable bindings is reported; nothing
 *      > that requires reasoning about reassignment is.
 *
 *      Two consequences accepted openly: a `let` holding a literal is a live hole, and a determined
 *      author can always reach it. That is the price of a boundary that can be stated in one
 *      paragraph and does not move, rather than a node-kind list that grows every review round.
 *
 *   6. **Empty and whitespace-only results are never findings.** `''`, `` `${c}` ``, `' '` are
 *      `dynamic` in effect, whichever rule above would otherwise have produced them.
 *
 * `foldClassExpression()` is a single `switch` over the expression's AST kind, ending in one
 * explicit `default: return DYNAMIC`. **This default is deliberate and permanent, not a gap: an
 * expression form the evaluator does not recognize is classified `dynamic` and is permitted.** A
 * gate that threw, or that guessed, on unfamiliar syntax would break on a routine TypeScript version
 * bump; failing open on the unrecognized case is the tradeoff this gate makes so that "no false
 * positive" stays true across TS releases, at the cost of never catching a class literal reached
 * through a genuinely novel expression form. `--explain <file>` (see Usage) exists so this boundary
 * is auditable by running the gate, not by re-reading this comment.
 *
 * "Static" (kickoff §6) means: the expression folds to a non-whitespace string under
 * `foldClassExpression()`, through value-preserving wrappers, branching, composition, aggregation,
 * and simple `const` bindings only. Mutable bindings are opaque by design.
 *
 * On a violation: prints file, line and the exact literal (plus the declaration line, for
 * identifier indirection), and exits 1. There is NO comment marker and NO author-reachable
 * exemption path — an allowlist file or an inline suppression comment would be a new exemption
 * mechanism, which Sprint 65 rule 2 forbids.
 *
 * Usage:
 *   node scripts/check-homepage-literal-utilities.mjs
 *   npm run check:homepage-literal-utilities
 *   node scripts/check-homepage-literal-utilities.mjs --explain <repo-relative-file>
 *     Prints, for every inspected site in <repo-relative-file>, its line, its source text, and the
 *     evaluator's classification (`static` with the folded value(s), or `dynamic`). Reads the file
 *     and nothing else; writes nothing; always exits 0, regardless of what it finds — it is an
 *     audit tool, not a gate.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const TARGET_FILES = [
  'src/design-system/mantine/patterns/MantineListingCardPattern.tsx',
  'src/components/shared/LocaleSwitcher.tsx',
  'src/app/[locale]/layout.tsx',
];

const CLSX_CALLEES = new Set(['cn', 'cx', 'clsx']);

function isPlainLiteral(node) {
  return ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node);
}

function templateHasNonWhitespaceText(node) {
  if (node.head.text.trim() !== '') return true;
  for (const span of node.templateSpans) {
    if (span.literal.text.trim() !== '') return true;
  }
  return false;
}

function lineOf(sourceFile, node) {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
}

/** Every identifier name a `BindingName` (plain identifier or nested destructuring pattern) binds. */
function bindingNames(nameNode) {
  const names = [];
  function walk(n) {
    if (ts.isIdentifier(n)) {
      names.push(n.text);
      return;
    }
    if (ts.isObjectBindingPattern(n) || ts.isArrayBindingPattern(n)) {
      for (const el of n.elements) {
        if (ts.isOmittedExpression(el)) continue;
        walk(el.name);
      }
    }
  }
  walk(nameNode);
  return names;
}

function isFunctionLikeWithParams(node) {
  return (
    ts.isFunctionDeclaration(node) ||
    ts.isFunctionExpression(node) ||
    ts.isArrowFunction(node) ||
    ts.isMethodDeclaration(node) ||
    ts.isConstructorDeclaration(node) ||
    ts.isGetAccessorDeclaration(node) ||
    ts.isSetAccessorDeclaration(node)
  );
}

/**
 * Matches `name` against a single `VariableDeclarationList` (a `const`/`let`/`var` statement, or a
 * `for`/`for-in`/`for-of` initializer's declaration list). Returns `{ opaque: true }` for a
 * destructured binding, a `let`/`var`, or a `const` with no initializer; `{ initializer, line }`
 * for a simple (non-destructured) `const` with an initializer; `null` if `name` is not declared in
 * this list at all.
 */
function matchDeclarationList(declList, name, sourceFile) {
  const isConst = Boolean(declList.flags & ts.NodeFlags.Const);
  for (const decl of declList.declarations) {
    if (ts.isIdentifier(decl.name)) {
      if (decl.name.text !== name) continue;
      if (isConst && decl.initializer) return { initializer: decl.initializer, line: lineOf(sourceFile, decl) };
      return { opaque: true };
    }
    if (bindingNames(decl.name).includes(name)) return { opaque: true };
  }
  return null;
}

/** Matches `name` against a default/named/namespace import binding on one `ImportDeclaration`. */
function matchImportBinding(stmt, name) {
  const clause = stmt.importClause;
  if (!clause) return null;
  if (clause.name && clause.name.text === name) return { opaque: true };
  const named = clause.namedBindings;
  if (named) {
    if (ts.isNamespaceImport(named) && named.name.text === name) return { opaque: true };
    if (ts.isNamedImports(named)) {
      for (const el of named.elements) {
        if (el.name.text === name) return { opaque: true };
      }
    }
  }
  return null;
}

/** Matches `name` against one statement's own binding (variable, import, function/class name). */
function matchStatement(stmt, name, sourceFile) {
  if (ts.isVariableStatement(stmt)) return matchDeclarationList(stmt.declarationList, name, sourceFile);
  if (ts.isImportDeclaration(stmt)) return matchImportBinding(stmt, name);
  if (ts.isFunctionDeclaration(stmt) && stmt.name && stmt.name.text === name) return { opaque: true };
  if (ts.isClassDeclaration(stmt) && stmt.name && stmt.name.text === name) return { opaque: true };
  return null;
}

/** Matches `name` against a whole statement list (a block, source file, or one switch clause). */
function matchStatements(statements, name, sourceFile) {
  for (const stmt of statements) {
    const m = matchStatement(stmt, name, sourceFile);
    if (m) return m;
  }
  return null;
}

function isFunctionOrClassScope(node) {
  return (
    ts.isFunctionDeclaration(node) ||
    ts.isFunctionExpression(node) ||
    ts.isArrowFunction(node) ||
    ts.isMethodDeclaration(node) ||
    ts.isConstructorDeclaration(node) ||
    ts.isGetAccessorDeclaration(node) ||
    ts.isSetAccessorDeclaration(node) ||
    ts.isClassDeclaration(node) ||
    ts.isClassExpression(node)
  );
}

/**
 * Every `var` name hoisted into `scopeNode`'s own function/source scope: collected by walking
 * every descendant statement — including nested `if`/block/loop/`catch`/`switch` bodies and
 * `for`/`for-in`/`for-of` initializers — but never descending into a nested function/class body,
 * which owns its own separate `var` scope. `var` is function/source-scoped in real JS, not
 * block-scoped like `let`/`const`, so a `var` declared inside a nested block is still visible (and
 * still opaque) at every point in the enclosing function/source scope, including before or after
 * that block.
 */
function collectHoistedVarNames(scopeNode) {
  const names = new Set();

  function visit(node) {
    if (!node) return;
    if (ts.isVariableStatement(node)) {
      if (!(node.declarationList.flags & (ts.NodeFlags.Const | ts.NodeFlags.Let))) {
        for (const decl of node.declarationList.declarations) {
          for (const n of bindingNames(decl.name)) names.add(n);
        }
      }
      return;
    }
    if (isFunctionOrClassScope(node)) return;
    if (
      (ts.isForStatement(node) || ts.isForInStatement(node) || ts.isForOfStatement(node)) &&
      node.initializer && ts.isVariableDeclarationList(node.initializer) &&
      !(node.initializer.flags & (ts.NodeFlags.Const | ts.NodeFlags.Let))
    ) {
      for (const decl of node.initializer.declarations) {
        for (const n of bindingNames(decl.name)) names.add(n);
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(scopeNode);
  return names;
}

/**
 * Resolves `name` to a `const` initializer by walking the identifier's own enclosing **runtime
 * bindings** outward — nearest binding wins, exactly as JS/TS lexical scoping shadows. Checks, at
 * each ancestor step: a function/arrow/method/constructor/accessor's own name (self-reference) and
 * parameter list (simple or destructured); a `for`/`for-in`/`for-of` statement's own declaration
 * list; a `catch` clause's binding (simple or destructured); a `switch` statement's shared
 * cross-clause lexical scope and each clause's own statements; and a block/source file/module
 * block's own `const`/`let`/`var` (simple or destructured), `import`, and function/class
 * declarations. Returns `{ initializer, line }` for a matching simple `const` with an initializer,
 * `{ opaque: true }` for any other real binding (parameter, destructured binding, `let`/`var`,
 * `catch`, `import`, function/class name, or a `const` with no initializer — resolution stops here,
 * the caller must not keep searching outward and must not report anything), or `null` when no
 * binding with that name exists anywhere in the file's ancestor chain (a legitimate external
 * identifier).
 */
function resolveIdentifierLexically(idNode, sourceFile, name) {
  let current = idNode;

  while (current) {
    const parent = current.parent;
    if (!parent) return null;

    if (
      (ts.isFunctionExpression(parent) || ts.isFunctionDeclaration(parent) ||
        ts.isClassExpression(parent) || ts.isClassDeclaration(parent)) &&
      parent.name && parent.name.text === name && current !== parent.name
    ) {
      return { opaque: true };
    }

    if (isFunctionLikeWithParams(parent) && parent.parameters) {
      for (const param of parent.parameters) {
        if (bindingNames(param.name).includes(name)) return { opaque: true };
      }
      // `var` is scoped to the whole function body, not to whichever nested block declares it —
      // check every hoisted `var` in this function before continuing to search outward.
      if (parent.body && collectHoistedVarNames(parent.body).has(name)) return { opaque: true };
    }

    if (
      (ts.isForStatement(parent) || ts.isForInStatement(parent) || ts.isForOfStatement(parent)) &&
      parent.initializer && ts.isVariableDeclarationList(parent.initializer)
    ) {
      const m = matchDeclarationList(parent.initializer, name, sourceFile);
      if (m) return m;
    }

    if (ts.isCatchClause(parent) && parent.variableDeclaration) {
      if (bindingNames(parent.variableDeclaration.name).includes(name)) return { opaque: true };
    }

    if (ts.isCaseClause(parent) || ts.isDefaultClause(parent)) {
      const m = matchStatements(parent.statements, name, sourceFile);
      if (m) return m;
    }

    if (ts.isCaseBlock(parent)) {
      // The whole switch shares one lexical scope across every clause, not just the current one.
      for (const clause of parent.clauses) {
        const m = matchStatements(clause.statements, name, sourceFile);
        if (m) return m;
      }
    }

    if (ts.isBlock(parent) || ts.isSourceFile(parent) || ts.isModuleBlock(parent)) {
      const m = matchStatements(parent.statements, name, sourceFile);
      if (m) return m;
      // The source file (and a module block) is itself a `var`/source scope boundary — a `var`
      // declared anywhere at the top level, however deeply nested in blocks/loops, is hoisted here.
      if ((ts.isSourceFile(parent) || ts.isModuleBlock(parent)) && collectHoistedVarNames(parent).has(name)) {
        return { opaque: true };
      }
    }

    current = parent;
  }

  return null;
}

// ── foldClassExpression: the Revision 5 evaluator (replaces the Revision 1-4 node-kind list) ──

const DYNAMIC = { kind: 'dynamic' };

function isWhitespaceOnly(text) {
  return text.trim() === '';
}

/** Rule 6 — empty and whitespace-only results are never findings. */
function makeStatic(findings) {
  const nonEmpty = findings.filter((f) => !isWhitespaceOnly(f.text));
  return nonEmpty.length === 0 ? DYNAMIC : { kind: 'static', findings: nonEmpty };
}

/** Combines multiple fold results (Rule 2's branch union): static wins if any input is static. */
function mergeStatic(...results) {
  const findings = [];
  for (const r of results) {
    if (r.kind === 'static') findings.push(...r.findings);
  }
  return makeStatic(findings);
}

/** Rule 5 — bindings fold only when the language guarantees the value. */
function foldIdentifier(idNode, sourceFile, seen) {
  const decl = resolveIdentifierLexically(idNode, sourceFile, idNode.text);
  if (!decl || !decl.initializer || seen.has(decl.initializer)) return DYNAMIC;
  seen.add(decl.initializer);
  const inner = foldClassExpression(decl.initializer, sourceFile, seen);
  if (inner.kind !== 'static') return DYNAMIC;
  return makeStatic(
    inner.findings.map((f) => ({ node: idNode, text: f.text, declLine: f.declLine ?? decl.line }))
  );
}

/**
 * Rule 4's spread invariant: a `SpreadElement` folds only when its operand resolves to an
 * `ArrayLiteralExpression` — directly, through a transparent Rule-1 wrapper around one, or through
 * a simple non-destructured `const` binding whose initializer recursively resolves the same way.
 * Deliberately narrower than the general evaluator: a spread of a string, a template, an object, a
 * call, a member expression, or any other expression that would itself fold statically is still
 * `null` here (dynamic) — spreading a string spreads its characters, not the string as a class
 * name, so `foldClassExpression()` must never be asked to classify a spread operand until this
 * function has already proven it is an array. Returns `{ arrayLiteral, declLine? }` on success —
 * `declLine` is the alias chain's own array-literal declaration (Revision 5.1's S9: `const A = […];
 * const B = A;` attributes to `A`, not `B`) — or `null`. `seenDecls` guards against a cyclic alias
 * chain (`const A = B; const B = A;`) recursing forever; it is local to one spread resolution and
 * never shared with `foldClassExpression()`'s own `seen` set.
 */
function resolveSpreadArrayLiteral(expr, sourceFile, seenDecls) {
  if (!expr) return null;

  if (
    ts.isParenthesizedExpression(expr) ||
    ts.isAsExpression(expr) ||
    ts.isSatisfiesExpression(expr) ||
    ts.isNonNullExpression(expr) ||
    ts.isTypeAssertionExpression(expr)
  ) {
    return resolveSpreadArrayLiteral(expr.expression, sourceFile, seenDecls);
  }

  if (ts.isArrayLiteralExpression(expr)) {
    return { arrayLiteral: expr, declLine: undefined };
  }

  if (ts.isIdentifier(expr)) {
    const decl = resolveIdentifierLexically(expr, sourceFile, expr.text);
    if (!decl || !decl.initializer || seenDecls.has(decl.initializer)) return null;
    seenDecls.add(decl.initializer);
    const inner = resolveSpreadArrayLiteral(decl.initializer, sourceFile, seenDecls);
    if (!inner) return null;
    return { arrayLiteral: inner.arrayLiteral, declLine: inner.declLine ?? decl.line };
  }

  return null;
}

/**
 * Classifies `expr` as `{ kind: 'static', findings: [{ node, text, declLine? }] }` when it can, on
 * some execution path, contribute a statically-known class string, or `{ kind: 'dynamic' }` when it
 * cannot. A single `switch` over `expr.kind`, implementing rules 1-5 above; the `default` branch is
 * the ONE explicit, permanent fall-through in this function (see WHAT IT CHECKS' fail-open note) —
 * every other branch returns explicitly, so nothing here can silently classify as dynamic by
 * omission the way `collectLiterals()`'s per-operator gaps did through Revision 4.
 */
function foldClassExpression(expr, sourceFile, seen) {
  if (!expr) return DYNAMIC;

  switch (expr.kind) {
    // Rule 1 — value-preserving wrappers are transparent.
    case ts.SyntaxKind.ParenthesizedExpression:
    case ts.SyntaxKind.AsExpression:
    case ts.SyntaxKind.SatisfiesExpression:
    case ts.SyntaxKind.NonNullExpression:
    case ts.SyntaxKind.TypeAssertionExpression:
      return foldClassExpression(expr.expression, sourceFile, seen);

    case ts.SyntaxKind.StringLiteral:
    case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
      return makeStatic([{ node: expr, text: expr.text }]);

    case ts.SyntaxKind.TemplateExpression: {
      // Rule 3 extension, found by adversarial probing during Revision 5 itself: a template is
      // static if its own head/span TEXT carries non-whitespace content, OR if any substitution's
      // own expression folds to a static value (e.g. `` `${'flex' + ' flex-col'}` `` composes a
      // literal entirely inside `${}` — text-only inspection missed this exactly like the pre-R16
      // node-kind list missed `+`). A substitution that does not fold statically (an unresolved
      // identifier, `` `${cls}` `` included) still contributes nothing, preserving that permitted
      // case exactly as before.
      let declLine;
      let substitutionStatic = false;
      for (const span of expr.templateSpans) {
        const r = foldClassExpression(span.expression, sourceFile, seen);
        if (r.kind === 'static') {
          substitutionStatic = true;
          if (!declLine) declLine = r.findings.find((f) => f.declLine)?.declLine;
        }
      }
      if (!templateHasNonWhitespaceText(expr) && !substitutionStatic) return DYNAMIC;
      return makeStatic([{ node: expr, text: expr.getText(sourceFile), declLine }]);
    }

    // Rule 2 — branching yields the union of reachable operands.
    case ts.SyntaxKind.ConditionalExpression:
      return mergeStatic(
        foldClassExpression(expr.whenTrue, sourceFile, seen),
        foldClassExpression(expr.whenFalse, sourceFile, seen)
      );

    case ts.SyntaxKind.BinaryExpression: {
      const opKind = expr.operatorToken.kind;

      if (opKind === ts.SyntaxKind.AmpersandAmpersandToken) {
        return foldClassExpression(expr.right, sourceFile, seen);
      }
      if (opKind === ts.SyntaxKind.BarBarToken || opKind === ts.SyntaxKind.QuestionQuestionToken) {
        return mergeStatic(
          foldClassExpression(expr.left, sourceFile, seen),
          foldClassExpression(expr.right, sourceFile, seen)
        );
      }
      // Comma: the expression's own value is its right operand only.
      if (opKind === ts.SyntaxKind.CommaToken) {
        return foldClassExpression(expr.right, sourceFile, seen);
      }
      // Rule 3 — composition preserves literal chunks, reported once for the whole expression,
      // exactly how TemplateExpression is treated.
      if (opKind === ts.SyntaxKind.PlusToken) {
        const l = foldClassExpression(expr.left, sourceFile, seen);
        const r = foldClassExpression(expr.right, sourceFile, seen);
        if (l.kind !== 'static' && r.kind !== 'static') return DYNAMIC;
        const declLine =
          (l.kind === 'static' && l.findings.find((f) => f.declLine)?.declLine) ||
          (r.kind === 'static' && r.findings.find((f) => f.declLine)?.declLine) ||
          undefined;
        return makeStatic([{ node: expr, text: expr.getText(sourceFile), declLine }]);
      }
      // Every other binary operator (===, -, *, instanceof, …) cannot compose a class string.
      return DYNAMIC;
    }

    // Rule 4 — aggregation sites recurse into their elements.
    case ts.SyntaxKind.ArrayLiteralExpression: {
      const findings = [];
      for (const el of expr.elements) {
        const r = foldClassExpression(el, sourceFile, seen);
        if (r.kind === 'static') findings.push(...r.findings);
      }
      return makeStatic(findings);
    }

    case ts.SyntaxKind.SpreadElement: {
      // Revision 5.1: the operand must be proven an array literal by resolveSpreadArrayLiteral()
      // BEFORE any folding happens — general foldClassExpression() is never asked to classify a
      // spread operand directly, so a spread of a string/template/object/call/member-expression
      // stays dynamic even though that same expression would fold statically anywhere else.
      const resolved = resolveSpreadArrayLiteral(expr.expression, sourceFile, new Set());
      if (!resolved) return DYNAMIC;
      const arrResult = foldClassExpression(resolved.arrayLiteral, sourceFile, seen);
      if (arrResult.kind !== 'static') return DYNAMIC;
      if (!resolved.declLine) return arrResult;
      // Reached the array only through identifier indirection: report at the use site (this
      // spread's own operand identifier), exactly as foldIdentifier() does, not at the array
      // literal's declaration — declLine alone carries the declaration line.
      return makeStatic(
        arrResult.findings.map((f) => ({
          node: expr.expression,
          text: f.text,
          declLine: f.declLine ?? resolved.declLine,
        }))
      );
    }

    case ts.SyntaxKind.ObjectLiteralExpression: {
      // clsx object form: each property KEY is the class name; values are conditions and are
      // never folded. ShorthandPropertyAssignment/SpreadAssignment contribute nothing (dynamic).
      const findings = [];
      for (const prop of expr.properties) {
        if (!ts.isPropertyAssignment(prop)) continue;
        const name = prop.name;
        if (ts.isStringLiteral(name) || ts.isNoSubstitutionTemplateLiteral(name)) {
          findings.push({ node: name, text: name.text });
        } else if (ts.isComputedPropertyName(name)) {
          const r = foldClassExpression(name.expression, sourceFile, seen);
          if (r.kind === 'static') findings.push(...r.findings);
        }
      }
      return makeStatic(findings);
    }

    case ts.SyntaxKind.Identifier:
      return foldIdentifier(expr, sourceFile, seen);

    default:
      // Fail open, deliberately: an expression form not recognized above cannot be determined
      // statically and is permitted. See the header's WHAT IT CHECKS fail-open note.
      return DYNAMIC;
  }
}

/**
 * Enumerates the VALUE side of a Mantine `classNames={{ ... }}` object literal as sites — the
 * inverse of the clsx object form: each property VALUE is the class name; keys are slot names and
 * are never folded. `ShorthandPropertyAssignment`/`SpreadAssignment` are skipped (dynamic).
 */
function classNamesObjectValueSites(objectLiteral) {
  const sites = [];
  for (const prop of objectLiteral.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    sites.push({ siteNode: prop, expr: prop.initializer });
  }
  return sites;
}

function scanFile(relPath) {
  const absPath = join(ROOT, relPath);
  const text = readFileSync(absPath, 'utf8');
  const sourceFile = ts.createSourceFile(absPath, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const violations = [];

  for (const site of collectSites(sourceFile)) {
    const result = foldClassExpression(site.expr, sourceFile, new Set());
    if (result.kind === 'static') {
      for (const f of result.findings) {
        violations.push({
          file: relPath,
          line: lineOf(sourceFile, f.node),
          literal: f.text,
          context: site.context,
          declLine: f.declLine,
        });
      }
    }
  }

  return violations;
}

/**
 * Every inspected site in `sourceFile`: a `{ siteNode, expr, context }` triple, where `siteNode` is
 * what a report's line number is measured from when `expr` itself doesn't carry it, and `expr` is
 * what gets folded. Shared by `scanFile()` (the gate) and `explainFile()` (`--explain`), so the two
 * can never see a different site set.
 */
function collectSites(sourceFile) {
  const sites = [];

  function visit(node) {
    if (ts.isJsxAttribute(node) && node.name.getText(sourceFile) === 'className' && node.initializer) {
      const init = node.initializer;
      if (isPlainLiteral(init)) {
        sites.push({ siteNode: init, expr: init, context: 'JSX className attribute (static string literal)' });
      } else if (ts.isJsxExpression(init) && init.expression) {
        sites.push({ siteNode: init, expr: init.expression, context: 'JSX className attribute expression' });
      }
    }

    if (
      ts.isJsxAttribute(node) &&
      node.name.getText(sourceFile) === 'classNames' &&
      node.initializer &&
      ts.isJsxExpression(node.initializer) &&
      node.initializer.expression &&
      ts.isObjectLiteralExpression(node.initializer.expression)
    ) {
      for (const entry of classNamesObjectValueSites(node.initializer.expression)) {
        sites.push({ ...entry, context: 'Mantine classNames prop value' });
      }
      // classNames={cn(...)} / cx(...) / clsx(...) needs no separate handling here — the call
      // expression is caught below during the same tree walk (ts.forEachChild recurses into it).
    }

    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && CLSX_CALLEES.has(node.expression.text)) {
      const callee = node.expression.text;
      for (const arg of node.arguments) {
        sites.push({ siteNode: arg, expr: arg, context: `${callee}() argument` });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return sites;
}

/** `--explain <file>`: prints every inspected site's line, source text, and classification. Reads only; exits 0. */
function explainFile(relPath) {
  const absPath = join(ROOT, relPath);
  let text;
  try {
    text = readFileSync(absPath, 'utf8');
  } catch (err) {
    console.error(`--explain: cannot read ${relPath}: ${err.message}`);
    return;
  }
  const sourceFile = ts.createSourceFile(absPath, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const sites = collectSites(sourceFile);

  console.log(`--explain ${relPath} — ${sites.length} inspected site(s):`);
  for (const site of sites) {
    const line = lineOf(sourceFile, site.siteNode);
    const srcText = site.siteNode.getText(sourceFile).replace(/\s+/g, ' ').trim();
    const result = foldClassExpression(site.expr, sourceFile, new Set());
    if (result.kind === 'static') {
      const values = result.findings
        .map((f) => `"${f.text}"${f.declLine ? ` [declared at ${relPath}:${f.declLine}]` : ''}`)
        .join(', ');
      console.log(`  ${relPath}:${line} (${site.context}) — static: ${values}`);
    } else {
      console.log(`  ${relPath}:${line} (${site.context}) — dynamic`);
    }
    console.log(`    source: ${srcText}`);
  }
}

function main() {
  const args = process.argv.slice(2);
  const explainIdx = args.indexOf('--explain');
  if (explainIdx !== -1) {
    const target = args[explainIdx + 1];
    if (!target) {
      console.error('Usage: node scripts/check-homepage-literal-utilities.mjs --explain <repo-relative-file>');
      process.exit(0);
    }
    explainFile(target);
    process.exit(0);
  }

  let allViolations = [];
  for (const relPath of TARGET_FILES) {
    allViolations = allViolations.concat(scanFile(relPath));
  }

  if (allViolations.length > 0) {
    console.error(`❌ check:homepage-literal-utilities — ${allViolations.length} static class literal(s) found:`);
    for (const v of allViolations) {
      const declSuffix = v.declLine ? ` [declared at ${v.file}:${v.declLine}]` : '';
      console.error(`   ${v.file}:${v.line} — "${v.literal}" (${v.context})${declSuffix}`);
    }
    process.exit(1);
  }

  console.log(`✅ check:homepage-literal-utilities — 0 static class literals across ${TARGET_FILES.length} guarded files.`);
  process.exit(0);
}

main();
