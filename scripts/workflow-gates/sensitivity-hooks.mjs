// Task 944 R1 (e) (owner D15, D16, 2026-11-03): the module `load` hook of `cli.mjs sensitivity`. It is registered only by
// sensitivity-register.mjs in the mutant run's test process. For the target file only it returns the source with the
// single `find` replaced; it never writes a file, so a sensitivity break exists only in the memory of that process.
import { readFileSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const key = path => (process.platform === 'win32' ? resolve(path).toLowerCase() : resolve(path));
const real = path => { try { return realpathSync.native(path); } catch { return path; } };
const lf = text => String(text).replace(/\r\n/g, '\n');
let spec = null;
let targets = new Set();

export function initialize(data) {
  spec = data && typeof data === 'object' ? data : null;
  targets = spec ? new Set([key(spec.target), key(real(spec.target))]) : new Set();
}

export async function load(url, context, next) {
  if (!spec || typeof url !== 'string' || !url.startsWith('file:')) return next(url, context);
  let path;
  try { path = fileURLToPath(url); } catch { return next(url, context); }
  if (!targets.has(key(path)) && !targets.has(key(real(path)))) return next(url, context);
  const source = lf(readFileSync(path, 'utf8'));
  const count = source.split(spec.find).length - 1;
  if (count !== 1) throw new Error(`SENSITIVITY: the break text occurs ${count} times in ${spec.target}, not exactly once`);
  const loaded = await next(url, context);
  return { format: loaded.format ?? context.format ?? 'module', source: source.replace(spec.find, () => spec.replace), shortCircuit: true };
}
