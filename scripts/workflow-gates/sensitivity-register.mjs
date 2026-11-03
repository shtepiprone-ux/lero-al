// Task 944 R1 (e) (owner D15, D16, 2026-11-03): loaded through `NODE_OPTIONS=--import=<this file>` only in the mutant run of
// `cli.mjs sensitivity`. It reads the break spec named by SENSITIVITY_BREAK and registers sensitivity-hooks.mjs with it; the
// target is resolved from the test process's working directory, the repository root of the run. It writes no file.
import { register } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const lf = text => String(text).replace(/\r\n/g, '\n');
const specPath = process.env.SENSITIVITY_BREAK;
if (specPath) {
  const spec = JSON.parse(readFileSync(specPath, 'utf8'));
  if (typeof spec?.target !== 'string' || typeof spec.find !== 'string' || typeof spec.replace !== 'string' || !spec.find) {
    throw new Error('SENSITIVITY: the break spec named by SENSITIVITY_BREAK is malformed');
  }
  register(new URL('./sensitivity-hooks.mjs', import.meta.url), {
    data: { target: resolve(process.cwd(), spec.target), find: lf(spec.find), replace: lf(spec.replace) },
  });
}
