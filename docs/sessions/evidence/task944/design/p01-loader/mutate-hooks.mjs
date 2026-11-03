import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
let spec;
export function initialize(data) { spec = data; }
export async function load(url, context, next) {
  if (url.split('?')[0].toLowerCase() !== spec.target.toLowerCase()) return next(url, context);
  const source = readFileSync(fileURLToPath(url), 'utf8');
  const count = source.split(spec.find).length - 1;
  if (count !== 1) throw new Error(`sensitivity break: find text occurs ${count} times in ${url}`);
  return { format: 'module', source: source.replace(spec.find, spec.replace), shortCircuit: true };
}
