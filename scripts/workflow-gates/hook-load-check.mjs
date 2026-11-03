#!/usr/bin/env node
// Task 944 R3 (b) (owner D16, 2026-11-03): the load check of the pre-write guard for hook-loaded modules. Run by
// security-hook.mjs as `node --experimental-vm-modules --no-warnings scripts/workflow-gates/hook-load-check.mjs` with JSON
// `{ entries, overrides }` on stdin (repository paths; an override is the text a write would leave). Every ESM entry is parsed
// and LINKED as a vm.SourceTextModule: relative specifiers resolve to files inside the root (the override text for an
// overridden file) and builtins to vm.SyntheticModules of the builtin namespace; a missing file or a bare package specifier
// is refused. No module is evaluated and no file is written. Prints `linked` and exits 0, or prints the first error and exits 1.
import vm from 'node:vm';
import { builtinModules } from 'node:module';
import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';

const slash = text => text.split('\\').join('/');
const lf = text => String(text).replace(/\r\n/g, '\n');
const isFile = path => { try { return statSync(path).isFile(); } catch { return false; } };

async function main() {
  if (typeof vm.SourceTextModule !== 'function' || typeof vm.SyntheticModule !== 'function') {
    throw new Error('vm.SourceTextModule is unavailable; run with --experimental-vm-modules');
  }
  const input = JSON.parse(readFileSync(0, 'utf8'));
  const root = realpathSync(process.cwd());
  const entries = Array.isArray(input?.entries) ? input.entries.filter(entry => typeof entry === 'string') : [];
  const overrides = new Map(Object.entries(input?.overrides && typeof input.overrides === 'object' ? input.overrides : {})
    .filter(([, text]) => typeof text === 'string').map(([file, text]) => [slash(file), lf(text)]));
  const modules = new Map(), builtins = new Map();
  let packageType = 'commonjs';
  try { packageType = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))?.type === 'module' ? 'module' : 'commonjs'; } catch { /* Node's default */ }
  // A CommonJS dependency is not parsed as ESM: it is represented by its `default` export only (the guard checks a CommonJS
  // closure module itself with `node --check --input-type=commonjs`).
  const commonjs = file => /\.cjs$/i.test(file) || (/\.js$/i.test(file) && packageType !== 'module');
  const inside = file => { const rel = relative(root, resolve(root, file)); return rel !== '' && !rel.startsWith('..') && !isAbsolute(rel); };
  const sourceModule = file => {
    if (modules.has(file)) return modules.get(file);
    if (!inside(file)) throw new Error(`${file} is outside the repository`);
    if (!overrides.has(file) && !isFile(resolve(root, file))) throw new Error(`cannot find module ${file}`);
    if (commonjs(file)) {
      const module = new vm.SyntheticModule(['default'], function exportDefault() { this.setExport('default', undefined); }, { identifier: file });
      modules.set(file, module);
      return module;
    }
    const text = overrides.has(file) ? overrides.get(file) : readFileSync(resolve(root, file), 'utf8');
    const module = new vm.SourceTextModule(text, { identifier: file });
    modules.set(file, module);
    return module;
  };
  const builtinModule = async name => {
    if (builtins.has(name)) return builtins.get(name);
    const namespace = await import(name);
    const names = Object.keys(namespace);
    const module = new vm.SyntheticModule(names, function exportAll() { for (const key of names) this.setExport(key, namespace[key]); }, { identifier: name });
    builtins.set(name, module);
    return module;
  };
  const linker = async (specifier, referencing) => {
    const bare = specifier.startsWith('node:') ? specifier.slice(5) : specifier;
    if (specifier.startsWith('node:') || builtinModules.includes(bare)) return builtinModule(`node:${bare}`);
    if (specifier.startsWith('./') || specifier.startsWith('../')) {
      return sourceModule(slash(relative(root, resolve(root, dirname(referencing.identifier), specifier))));
    }
    throw new Error(`${referencing.identifier} imports the package specifier '${specifier}', which the hook-module guard cannot check`);
  };
  for (const entry of entries.map(slash)) {
    if (commonjs(entry) || (!overrides.has(entry) && !existsSync(resolve(root, entry)))) continue;
    const module = sourceModule(entry);
    if (module.status === 'unlinked') await module.link(linker);
  }
  console.log('linked');
}

main().catch(error => {
  console.error(`${error?.name || 'Error'}: ${String(error?.message ?? error).split('\n')[0]}`);
  process.exitCode = 1;
});
