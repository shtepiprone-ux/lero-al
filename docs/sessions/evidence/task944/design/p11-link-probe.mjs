// Task 944 self-audit 2 probe p11 (Opus task designer): a write can stop a hook module from LOADING without any syntax error.
// Part A shows `node --check` accepting two such results. Part B shows that vm.SourceTextModule (node --experimental-vm-modules)
// parses and LINKS the hook-module graph with the proposed text, without evaluating any module, and refuses both.
// Usage: node --experimental-vm-modules p11-link-probe.mjs   (from the repository root; writes nothing)
import vm from 'node:vm';
import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { builtinModules } from 'node:module';

const root = process.cwd();
const ENTRY = 'scripts/workflow-gates/security-hook.mjs';
const check = text => spawnSync(process.execPath, ['--check', '--input-type=module', '-'], { input: text, encoding: 'utf8' }).status;

async function linkErrors(overrides) {
  const cache = new Map();
  const read = file => (file in overrides ? overrides[file] : readFileSync(resolve(root, file), 'utf8'));
  const builtin = async specifier => {
    const ns = await import(specifier);
    const names = Object.keys(ns);
    return new vm.SyntheticModule(names, function () { for (const n of names) this.setExport(n, ns[n]); }, { identifier: specifier });
  };
  const load = file => {
    if (cache.has(file)) return cache.get(file);
    if (!(file in overrides) && !existsSync(resolve(root, file))) throw new Error(`cannot find module ${file}`);
    const mod = new vm.SourceTextModule(read(file), { identifier: file });
    cache.set(file, mod);
    return mod;
  };
  const linker = async (specifier, referencing) => {
    const bare = specifier.replace(/^node:/, '');
    if (specifier.startsWith('node:') || builtinModules.includes(bare)) return builtin(specifier.startsWith('node:') ? specifier : `node:${specifier}`);
    if (specifier.startsWith('.')) {
      const file = resolve(root, dirname(referencing.identifier), specifier).slice(root.length + 1).split(String.fromCharCode(92)).join('/');
      return load(file);
    }
    throw new Error(`bare specifier ${specifier} not handled by the probe`);
  };
  try { await load(ENTRY).link(linker); return 'linked'; }
  catch (error) { return `${error.name}: ${error.message.split('\n')[0]}`; }
}

const hook = readFileSync(resolve(root, ENTRY), 'utf8');
const contract = readFileSync(resolve(root, 'scripts/workflow-gates/contract.mjs'), 'utf8');
const missingImport = hook.replace("import { sessionRole } from './session-role.mjs';", "import { sessionRole } from './session-role.mjs';\nimport { later } from './not-yet-written.mjs';");
const removedExport = contract.replace('export const isEvidencePath =', 'const isEvidencePath =');
console.log('A1 node --check, hook importing a file not written yet: exit', check(missingImport));
console.log('A2 node --check, contract.mjs without the isEvidencePath export: exit', check(removedExport));
console.log('B0 link, live graph:', await linkErrors({}));
console.log('B1 link, hook importing a file not written yet:', await linkErrors({ [ENTRY]: missingImport }));
console.log('B2 link, contract.mjs without the isEvidencePath export:', await linkErrors({ 'scripts/workflow-gates/contract.mjs': removedExport }));
console.log('B3 link, the incident line comment:', await linkErrors({ 'scripts/workflow-gates/contract.mjs': contract.replace('if (source !== null) check(source.includes(`[${row.id}]`), ', 'if (false && source !== null) check(source.includes(`[${row.id}]`), // SENSITIVITY BREAK ') }));
