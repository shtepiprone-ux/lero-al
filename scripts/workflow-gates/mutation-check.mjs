#!/usr/bin/env node
// Task 945 (owner, 2026-11-05: "add the mutation check to this task"): a green test proves nothing if the test would stay green over wrong code.
// So the lines a change wrote are broken on purpose, one defect per run, in memory only (mutation-loader.mjs), and the tests that reach the file
// run against each. A defect no test notices is a line no test checks. Each run is compared with a control run of the same command and the
// unchanged text, because a broken harness "catches" every defect, and with the loader's report, because a run that never loaded the file
// says nothing. A surviving defect may mean the same as the original, so this stops the agent once per version and is never a lasting refusal.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { moduleKey } from './mutation-loader.mjs';

const LOADER = pathToFileURL(fileURLToPath(new URL('./mutation-loader.mjs', import.meta.url))).href;
const REPORT_FOLDER = 'test-results/code-check/mutants';
const FLIPPED = { '===': '!==', '!==': '===', '==': '!=', '!=': '==', '<': '>=', '>': '<=', '<=': '>', '>=': '<', '&&': '||', '||': '&&' };
const ARITHMETIC = { '+': '-', '-': '+', '*': '/', '/': '*', '%': '*' };
const METHODS = { some: 'every', every: 'some', min: 'max', max: 'min', startsWith: 'endsWith', endsWith: 'startsWith' };
// Calls that write a log line change nothing a caller can rely on.
const LOGGING = /^(?:console|logger|log|Sentry)\b/;
const MAX_REPLACEMENT = 4000;

const globToRegExp = pattern => new RegExp(`^${pattern.replace(/\*\*\/|\*|[.+?^${}()|[\]\\]/g, token => {
  if (token === '**/') return '(?:.*/)?';
  if (token === '*') return '[^/]*';
  return `\\${token}`;
})}$`);
export const matcher = paths => {
  const patterns = paths.map(globToRegExp);
  return file => patterns.some(pattern => pattern.test(file));
};
const excerpt = text => text.replace(/\s+/g, ' ').trim().slice(0, 70);

// Every defect the text allows on the given lines; `lines` null means the whole file. Rank 0 is what guards behaviour, so it is tried first.
export function mutantsOf(ts, file, text, lines = null) {
  // The parser reads the language from the file's extension.
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const parses = mutated => ts.createSourceFile(file, mutated, ts.ScriptTarget.Latest, false).parseDiagnostics.length === 0;
  const found = [];
  const add = (position, start, end, replacement, rank) => {
    const line = source.getLineAndCharacterOfPosition(position).line + 1;
    if (lines && !lines.has(line)) return;
    const original = text.slice(start, end);
    if (replacement.length > MAX_REPLACEMENT || original === replacement) return;
    if (parses(`${text.slice(0, start)}${replacement}${text.slice(end)}`)) found.push({ line, start, end, original, replacement, rank });
  };
  const whole = (node, replacement, rank) => add(node.getStart(source), node.getStart(source), node.getEnd(), replacement, rank);
  const isText = node => ts.isStringLiteralLike(node) || ts.isTemplateExpression(node);
  const isLiteralValue = node => [ts.SyntaxKind.TrueKeyword, ts.SyntaxKind.FalseKeyword, ts.SyntaxKind.NullKeyword].includes(node.kind) || (ts.isIdentifier(node) && node.text === 'undefined');
  const negate = condition => {
    const plain = ts.isBinaryExpression(condition) && (condition.operatorToken.getText(source) in FLIPPED);
    const negated = ts.isPrefixUnaryExpression(condition) && condition.operator === ts.SyntaxKind.ExclamationToken;
    if (!plain && !negated) whole(condition, `!(${condition.getText(source)})`, 0);
  };
  const removable = expression => {
    const inner = ts.isAwaitExpression(expression) ? expression.expression : expression;
    if (ts.isCallExpression(inner)) return !LOGGING.test(inner.expression.getText(source));
    if (ts.isBinaryExpression(inner)) return inner.operatorToken.kind >= ts.SyntaxKind.FirstAssignment && inner.operatorToken.kind <= ts.SyntaxKind.LastAssignment;
    return ts.isPostfixUnaryExpression(inner) || (ts.isPrefixUnaryExpression(inner) && [ts.SyntaxKind.PlusPlusToken, ts.SyntaxKind.MinusMinusToken].includes(inner.operator));
  };
  const skipped = node => ts.isTypeNode(node) || ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node) || ts.isImportDeclaration(node) || ts.isExportDeclaration(node) || ts.isModuleDeclaration(node) || ts.isEnumDeclaration(node);
  const visit = node => {
    if (skipped(node) || (ts.canHaveModifiers(node) && ts.getModifiers(node)?.some(modifier => modifier.kind === ts.SyntaxKind.DeclareKeyword))) return;
    if (ts.isBinaryExpression(node)) {
      const operator = node.operatorToken;
      const text_ = operator.getText(source);
      const place = operator.getStart(source);
      if (text_ in FLIPPED) add(place, place, operator.getEnd(), FLIPPED[text_], 0);
      // `a ?? b ?? c` cannot take `&&` for one link, so the whole expression is replaced and its operands stay in brackets.
      else if (text_ === '??') add(place, node.getStart(source), node.getEnd(), `((${node.left.getText(source)}) && (${node.right.getText(source)}))`, 0);
      // `+` over text joins it; breaking that says nothing about logic and fills the list with message wording.
      else if (text_ in ARITHMETIC && !isText(node.left) && !isText(node.right)) add(place, place, operator.getEnd(), ARITHMETIC[text_], 2);
    } else if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.ExclamationToken) {
      whole(node, node.operand.getText(source), 0);
    } else if (node.kind === ts.SyntaxKind.TrueKeyword) whole(node, 'false', 1);
    else if (node.kind === ts.SyntaxKind.FalseKeyword) whole(node, 'true', 1);
    else if (ts.isNumericLiteral(node) && !ts.isJsxExpression(node.parent) && !/[^\d]/.test(node.text)) whole(node, String(Number(node.text) + 1), 2);
    else if (ts.isIfStatement(node) || ts.isWhileStatement(node)) negate(node.expression);
    else if (ts.isConditionalExpression(node)) negate(node.condition);
    else if (ts.isThrowStatement(node)) whole(node, ';', 0);
    else if (ts.isExpressionStatement(node) && removable(node.expression)) whole(node, ';', 0);
    else if (ts.isReturnStatement(node) && node.expression && !isLiteralValue(node.expression)) whole(node.expression, 'undefined', 1);
    else if (ts.isPropertyAccessExpression(node) && ts.isCallExpression(node.parent) && node.parent.expression === node && node.name.text in METHODS) whole(node.name, METHODS[node.name.text], 0);
    ts.forEachChild(node, visit);
  };
  visit(source);
  // One defect of each line before a second of any line, so that a cut-off run has still looked at every line it reached.
  const perLine = new Map();
  for (const mutant of found.sort((a, b) => a.rank - b.rank || a.start - b.start)) perLine.set(mutant.line, [...(perLine.get(mutant.line) || []), mutant]);
  const order = [];
  for (let turn = 0; order.length < found.length; turn++) for (const line of [...perLine.keys()].sort((a, b) => a - b)) if (perLine.get(line)[turn]) order.push(perLine.get(line)[turn]);
  return order;
}

// The lines this change wrote, against HEAD; null when the file has no blob at HEAD, so all of it is new.
export function changedLines(root, file, base = 'HEAD') {
  const git = (...args) => spawnSync('git', ['--no-optional-locks', ...args], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 26, windowsHide: true });
  if (git('cat-file', '-e', `${base}:${file}`).status !== 0) return null;
  const diff = git('diff', '--no-ext-diff', '-U0', '-w', base, '--', file);
  if (diff.status !== 0) throw new Error(`git diff of ${file} failed: ${String(diff.stderr).trim()}`);
  const lines = new Set();
  for (const [, first, count] of diff.stdout.matchAll(/^@@ -\S+ \+(\d+)(?:,(\d+))? @@/gm)) for (let i = 0; i < Number(count ?? 1); i++) lines.add(Number(first) + i);
  return lines;
}

const IMPORT_FORMS = ['', '.ts', '.tsx', '.mjs', '.js', '/index.ts', '/index.tsx'];
// What a changed test exists to check: the module of its own name when it has one, else every project module it imports directly.
export function targetsOfTest(ts, root, test) {
  const text = readFileSync(join(root, test), 'utf8');
  const source = ts.createSourceFile(test, text, ts.ScriptTarget.Latest, false);
  const specifiers = [...source.statements.filter(ts.isImportDeclaration).map(node => node.moduleSpecifier.text),
    ...[...text.matchAll(/\bimport\(\s*['"]([^'"]+)['"]\s*\)/g)].map(match => match[1])];
  const files = new Set();
  for (const specifier of specifiers) {
    const base = specifier.startsWith('@/') ? join('src', specifier.slice(2)) : specifier.startsWith('.') ? join(dirname(test), specifier) : null;
    if (!base) continue;
    const found = IMPORT_FORMS.map(form => `${base}${form}`.replaceAll('\\', '/')).find(path => statFile(root, path));
    if (found) files.add(found);
  }
  const stem = path => path.split('/').pop().replace(/(?:\.test)?\.[cm]?[jt]sx?$/, '');
  const own = [...files].filter(file => stem(file) === stem(test));
  return own.length ? own : [...files];
}
const statFile = (root, path) => existsSync(join(root, path)) && /\.[cm]?[jt]sx?$/.test(path);

// Which file is broken, and with which command its tests run.
export function planOf(ts, root, config, files, all = false, base = 'HEAD') {
  const skip = matcher(config.skip || []);
  const rows = config.rows.map(row => ({ ...row, matches: matcher(row.paths) }));
  const stemOf = file => file.split('/').pop().replace(/\.[^.]+$/, '');
  const rowsFor = file => rows.filter(row => row.matches(file) && (!row.needs || existsSync(join(root, row.needs.replaceAll('{stem}', stemOf(file))))));
  const rowFor = file => rowsFor(file)[0];
  const commandOf = (row, file) => row.run.replaceAll('{file}', `"${file}"`).replaceAll('{stem}', stemOf(file));
  const plan = [], tests = [];
  for (const file of files) {
    const row = rowFor(file);
    if (!row || !existsSync(join(root, file))) continue;
    if (row.test) { tests.push({ file, row }); continue; }
    if (skip(file)) continue;
    const command = commandOf(row, file);
    // A scanner with no vitest test may have a self-test in the gate suite: the next row is asked when this one never loads the file.
    const others = [...new Map(rowsFor(file).slice(1).map(other => [commandOf(other, file), other])).entries()].filter(([text]) => text !== command).map(([text, other]) => ({ command: text, concurrency: other.concurrency || config.concurrency || 1 }));
    plan.push({ file, lines: all ? null : changedLines(root, file, base), command, others, priority: row.priority || 0, concurrency: row.concurrency || config.concurrency || 1 });
  }
  // A changed test with no change in what it tests: all of that file is broken, against this test alone. The check is of the test.
  for (const { file, row } of tests) {
    for (const target of targetsOfTest(ts, root, file)) {
      if (skip(target) || plan.some(item => item.file === target) || rowFor(target)?.test) continue;
      plan.push({ file: target, lines: null, command: commandOf(row, file), others: [], priority: row.priority || 0, byTest: file, concurrency: row.concurrency || config.concurrency || 1 });
    }
  }
  // A review with little time spends it where a small command answers: a whole suite costs minutes before its first defect.
  return plan.sort((a, b) => a.priority - b.priority);
}

// Runs each mutant of each planned file against its tests. Nothing here passes because a run did not finish: every mutant ends in one of the
// counts of the result, and the caller shows all that are not `caught`.
export async function runMutation({ root, config, files, deadline, runCommand, all = false, base = 'HEAD', now = Date.now }) {
  const { default: ts } = await import('typescript');
  mkdirSync(join(root, REPORT_FOLDER), { recursive: true });
  const plan = planOf(ts, root, config, files, all, base);
  const results = [];
  let serial = 0;
  const costs = new Map();
  const attempt = async (item, mutant, limit) => {
    const report = join(root, REPORT_FOLDER, `${process.pid}-${serial++}.log`);
    const started = now();
    const run = await runCommand(item.command, root, limit, {
      CODE_CHECK_MUTANT: JSON.stringify({ key: moduleKey(resolve(root, item.file)), start: mutant.start, end: mutant.end, original: mutant.original, replacement: mutant.replacement, report }),
      NODE_OPTIONS: `${process.env.NODE_OPTIONS ? `${process.env.NODE_OPTIONS} ` : ''}--import=${LOADER}`,
      // A `node --test` that inherits this from a runner above it reports its files as run and runs none.
      NODE_TEST_CONTEXT: undefined,
    });
    const said = existsSync(report) ? readFileSync(report, 'utf8') : '';
    rmSync(report, { force: true });
    return { ...run, ms: now() - started, applied: said.includes('applied'), mismatch: said.includes('mismatch') };
  };
  for (const [index, item] of plan.entries()) {
    const text = readFileSync(join(root, item.file), 'utf8');
    const mutants = mutantsOf(ts, item.file, text, item.lines);
    const result = { file: item.file, byTest: item.byTest, total: mutants.length, caught: 0, survivors: [], undecided: 0, notTried: 0, notLoaded: false, error: null };
    results.push(result);
    if (!mutants.length) continue;
    // What is left is shared among the files still to come; time a file does not use passes on.
    const share = now() + Math.max(0, deadline - now()) / (plan.length - index);
    const left = () => share - now();
    if (left() <= 0) { result.notTried = mutants.length; continue; }
    let chosen = item, control = null;
    for (const candidate of [item, ...item.others]) {
      chosen = { ...item, ...candidate };
      // A command already measured as dearer than this file's share would spend it all on the control and try nothing: the time passes on.
      if (costs.get(chosen.command) > left()) { control = null; break; }
      control = await attempt(chosen, { ...mutants[0], replacement: mutants[0].original }, deadline - now());
      costs.set(chosen.command, control.ms);
      if (control.status !== 0 || control.applied) break;
    }
    if (!control) { result.notTried = mutants.length; continue; }
    if (control.status === null && control.reason === 'timeout') { result.notTried = mutants.length; continue; }
    if (control.mismatch) { result.error = 'a run loaded other text than the file holds'; continue; }
    if (control.status !== 0) { result.error = `its tests fail with no defect in it, under the mutation runner (exit ${control.status}): ${excerpt(control.output.slice(-400))}`; continue; }
    if (!control.applied) { result.notLoaded = true; continue; }
    const perRun = Math.max(config.perMutantMs || 0, control.ms * 3);
    const queue = [...mutants];
    const worker = async () => {
      for (;;) {
        const mutant = queue.shift();
        if (!mutant) return;
        if (left() < control.ms) { queue.unshift(mutant); return; }
        const budget = deadline - now();
        const run = await attempt(chosen, mutant, Math.min(perRun, budget));
        // A run cut off by the time of the stage decided nothing; one cut off by its own limit hung because of the defect.
        if (run.status === null && run.reason === 'timeout') { if (budget < perRun) result.notTried++; else result.caught++; }
        else if (run.status === null || !run.applied || run.mismatch) result.undecided++;
        else if (run.status === 0) result.survivors.push({ line: mutant.line, from: excerpt(mutant.original), to: excerpt(mutant.replacement) });
        else result.caught++;
      }
    };
    await Promise.all(Array.from({ length: chosen.concurrency }, worker));
    result.notTried += queue.length;
    result.survivors.sort((a, b) => a.line - b.line);
  }
  return results;
}

// One line of text per thing the agent has to know, by file. A file whose every defect was caught says nothing.
export function reportLines(results, shown = 8) {
  const lines = {};
  for (const result of results) {
    const own = [];
    if (result.error) own.push(`${result.file}: the mutation check could not run: ${result.error}`);
    if (result.notLoaded) own.push(`${result.file}: the tests that should reach it never loaded it${result.byTest ? ` (${result.byTest})` : ''}, so they check nothing in it`);
    for (const { line, from, to } of result.survivors.slice(0, shown)) own.push(`${result.file}:${line}: \`${from}\` became \`${to}\`, and every test${result.byTest ? ` of ${result.byTest}` : ''} still passed`);
    if (result.survivors.length > shown) own.push(`${result.file}: and ${result.survivors.length - shown} more of the same`);
    if (result.notTried || result.undecided) own.push(`${result.file}: of ${result.total} defects, ${result.notTried} not tried because time ran out${result.undecided ? ` and ${result.undecided} undecided` : ''}: node scripts/workflow-gates/mutation-check.mjs ${result.byTest ? '--all ' : ''}${result.file} tries them`);
    if (own.length) lines[result.file] = own;
  }
  return lines;
}

const pathKey = path => {
  let real = resolve(path);
  try { real = realpathSync.native(real); } catch { /* the resolved path */ }
  return process.platform === 'win32' ? real.toLowerCase() : real;
};
// By hand, with no time limit of the hook: the changed lines of the named files, or with --all every line, which is how an existing test is judged.
if (process.argv[1] && pathKey(process.argv[1]) === pathKey(fileURLToPath(import.meta.url))) {
  const { runCommand } = await import('./code-check.mjs');
  const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const args = process.argv.slice(2);
  const all = args.includes('--all');
  const files = args.filter(arg => !arg.startsWith('--')).map(arg => arg.replaceAll('\\', '/'));
  if (!files.length) { process.stderr.write('usage: mutation-check.mjs [--all] [--minutes=N] <files>\n'); process.exit(2); }
  const minutes = Number(args.find(arg => arg.startsWith('--minutes='))?.slice(10) || 30);
  const { mutation: config } = JSON.parse(readFileSync(join(root, 'scripts/workflow-gates/code-check.json'), 'utf8'));
  const results = await runMutation({ root, config, files, deadline: Date.now() + minutes * 60000, runCommand, all });
  const lines = reportLines(results, Infinity);
  for (const result of results) process.stdout.write(`${result.file}: ${result.total} defects, ${result.caught} caught, ${result.survivors.length} not caught, ${result.notTried} not tried, ${result.undecided} undecided\n`);
  for (const own of Object.values(lines)) for (const line of own) process.stdout.write(`${line}\n`);
  process.exit(Object.keys(lines).length ? 1 : 0);
}
