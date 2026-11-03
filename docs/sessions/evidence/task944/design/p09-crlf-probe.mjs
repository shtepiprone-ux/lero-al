// Task 944 self-audit probe p09: an Edit old_string written with LF line breaks against a CRLF working-tree module.
// R3 (b) as first written ("current file with old_string replaced") cannot locate it, so the guard would add nothing;
// after CRLF -> LF normalization of both sides the result is computed and the syntax check refuses it. Writes nothing.
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const file = 'scripts/workflow-gates/contract.mjs';
const raw = readFileSync(file, 'utf8');
const lf = raw.replace(/\r\n/g, '\n');
const before = [
  '    for (const row of rows) {',
  '      if (source !== null) check(source.includes(`[${row.id}]`), ',
].join('\n');
const after = [
  '    for (const row of rows) {',
  '      if (false && source !== null) check(source.includes(`[${row.id}]`), // SENSITIVITY BREAK ',
].join('\n');
const check = text => spawnSync(process.execPath, ['--check', '--input-type=module', '-'], { input: text, encoding: 'utf8' }).status;
console.log('CRLF lines in live file:', (raw.match(/\r\n/g) || []).length);
console.log('raw file includes LF old_string:', raw.includes(before));
console.log('normalized file includes LF old_string:', lf.includes(before));
console.log('syntax check of the normalized result: exit', check(lf.replace(before, after)));
