#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { posix, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { safePath } from './contract.mjs';

// Resolve against committed files plus the explicit handoff, never unrelated dirty package/scripts.
export function candidateReader(root, base, files) {
  const overlay = new Set(files);
  const commit = execFileSync('git', ['--no-optional-locks', 'rev-parse', '--verify', `${base}^{commit}`], { cwd: root, encoding: 'utf8' }).trim();
  return file => {
    const path = safePath(root, file, false);
    if (overlay.has(file)) return readFileSync(path, 'utf8');
    return execFileSync('git', ['--no-optional-locks', 'show', `${commit}:${file}`], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  };
}
export function publicationErrors(read, files) {
  const errors = [], visited = new Set(), scripts = new Set();
  const load = file => { try { return read(file); } catch { errors.push(`Candidate dependency is unavailable: ${file}`); return ''; } };
  const json = file => { try { return JSON.parse(load(file)); } catch { errors.push(`Candidate JSON is invalid: ${file}`); return {}; } };
  const pkg = json('package.json');
  const visit = file => {
    if (visited.has(file) || file.startsWith('node_modules/')) return;
    visited.add(file);
    const text = load(file);
    if (!/.(?:[cm]?[jt]s|ps1)$/.test(file)) return;
    const imports = [];
    if (!file.endsWith('.ps1')) {
      const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
      const walk = node => {
        if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) imports.push(node.moduleSpecifier.text);
        if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && ts.isStringLiteral(node.arguments[0])) imports.push(node.arguments[0].text);
        if (ts.isNewExpression(node) && node.expression.getText(source) === 'URL' && node.arguments?.length === 2
          && ts.isStringLiteral(node.arguments[0]) && node.arguments[1].getText(source) === 'import.meta.url') imports.push(node.arguments[0].text);
        ts.forEachChild(node, walk);
      };
      walk(source);
    }
    for (const imported of imports.filter(p => p.startsWith('.') && /\.[a-z]+$/i.test(p))) {
      const target = posix.normalize(posix.join(posix.dirname(file), imported));
      if (target.startsWith('../')) errors.push(`Candidate import escapes repository: ${file}`);
      else visit(target);
    }
    if (file.endsWith('.ps1')) for (const match of text.matchAll(/Join-Path \$PSScriptRoot '([^']+\.ps1)'/g)) visit(posix.join(posix.dirname(file), match[1]));
  };
  const command = text => {
    for (const match of text.matchAll(/\bnode\s+(?:\.\/)?(scripts\/[\w./-]+\.[cm]?js)/g)) visit(match[1]);
    for (const match of text.matchAll(/npm run ([\w:.-]+)/g)) npm(match[1]);
  };
  const npm = name => {
    if (scripts.has(name)) return; scripts.add(name);
    if (!pkg.scripts?.[name]) { errors.push(`Candidate npm script is unavailable: ${name}`); return; }
    command(pkg.scripts[name]);
    for (const prefix of ['pre', 'post']) if (pkg.scripts[prefix + name]) npm(prefix + name);
  };
  const policy = json('scripts/workflow-gates/pipeline.json');
  for (const args of Object.values(policy.groups || {}).flat()) {
    if (args[0] === 'npm') npm(args[2]); else if (args[0] === 'node') visit(args[1]);
  }
  const workflow = json('.github/workflows/governance-pr.yml');
  for (const job of Object.values(workflow.jobs || {})) for (const step of job.steps || []) if (step.run) command(step.run);
  const settings = json('.claude/settings.json');
  for (const groups of Object.values(settings.hooks || {})) for (const group of groups) for (const hook of group.hooks || []) {
    for (const arg of hook.args || []) if (arg.startsWith('${CLAUDE_PROJECT_DIR}/')) visit(arg.slice('${CLAUDE_PROJECT_DIR}/'.length));
  }
  for (const file of files) visit(file);
  return [...new Set(errors)];
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
    const manifest = JSON.parse(readFileSync(join(root, 'scripts/workflow-gates/publication.json'), 'utf8'));
    const files = [...manifest.ownedFiles, ...manifest.dependencyFiles];
    if (manifest.version !== 1 || !files.length || new Set(files).size !== files.length) throw new Error('Invalid publication manifest');
    const base = process.argv.includes('--base') ? process.argv[process.argv.indexOf('--base') + 1] : 'HEAD';
    if (base !== 'HEAD' && !/^[a-f0-9]{40}$/i.test(base || '')) throw new Error('Publication base must be HEAD or a full commit SHA');
    const errors = publicationErrors(candidateReader(root, base, files), files);
    mkdirSync(join(root, 'test-results/workflow-gates'), { recursive: true });
    writeFileSync(join(root, 'test-results/workflow-gates/publication.json'), JSON.stringify({ version: 1, base, files, errors }, null, 2) + '\n');
    for (const error of errors) console.error(`BLOCKED: ${error}`);
    console.log(`Publication candidate: ${files.length} explicit files, ${errors.length} dependency errors.`);
    process.exitCode = errors.length ? 1 : 0;
  } catch (error) { console.error(`BLOCKED: ${error.message}`); process.exitCode = 1; }
}
