// Prototype for the correction of Task 945 review 2: every Node process of a mutant run records the paths it writes, so that the guard can tell a mutant's write from
// another writer's. Design evidence to read, not code to paste. Loaded by p05-attribution.mjs through NODE_OPTIONS, as mutation-loader.mjs is.
import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import process from 'node:process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const report = process.env.CODE_CHECK_WRITES;
if (report) {
  const { appendFileSync } = fs;
  const named = path => (path instanceof URL ? fileURLToPath(path) : Buffer.isBuffer(path) ? path.toString() : typeof path === 'string' ? path : null);
  // appendFileSync calls writeFileSync through the module, so the record itself must not be recorded.
  let inside = false;
  const note = path => {
    if (inside) return;
    const text = named(path);
    if (!text) return;
    inside = true;
    try { appendFileSync(report, `${resolve(text)}\n`); } finally { inside = false; }
  };
  const firstArgument = ['writeFile', 'writeFileSync', 'appendFile', 'rm', 'rmSync', 'unlink', 'unlinkSync', 'truncate', 'truncateSync', 'createWriteStream'];
  const bothArguments = ['rename', 'renameSync', 'copyFile', 'copyFileSync', 'cp', 'cpSync'];
  const wrap = (holder, name, positions) => {
    const original = holder[name];
    if (typeof original !== 'function') return;
    holder[name] = function wrapped(...args) { for (const position of positions) note(args[position]); return original.apply(this, args); };
  };
  for (const name of firstArgument) wrap(fs, name, [0]);
  for (const name of bothArguments) wrap(fs, name, [0, 1]);
  for (const name of ['writeFile', 'appendFile', 'rm', 'unlink', 'truncate']) wrap(fs.promises, name, [0]);
  for (const name of ['rename', 'copyFile', 'cp']) wrap(fs.promises, name, [0, 1]);
  const { openSync } = fs;
  fs.openSync = function wrapped(path, flags, ...rest) { if (typeof flags === 'string' && /[wa+]/.test(flags)) note(path); return openSync.call(this, path, flags, ...rest); };
  syncBuiltinESMExports();
}
