/**
 * r6-95-mojibake-tools.mjs - AC27 helpers for `check:mojibake` (Task 923, R27)
 *
 *   node docs/sessions/evidence/task923/r6-95-mojibake-tools.mjs bytes   prints the byte count of the listing that
 *        scripts/check-mojibake.mjs reads (the same read-only Git listing, a generous buffer) and the default maxBuffer
 *   node docs/sessions/evidence/task923/r6-95-mojibake-tools.mjs plant   writes docs/sessions/evidence/task923/r6-planted-mojibake.md,
 *        a file holding the mojibake form of an en dash (U+00E2 U+20AC U+201C), built from code points: this script
 *        itself never contains the mojibake text
 *   node docs/sessions/evidence/task923/r6-95-mojibake-tools.mjs unplant   deletes that file
 */
import { spawnSync } from 'node:child_process';
import { existsSync, unlinkSync, writeFileSync } from 'node:fs';

const PLANTED = 'docs/sessions/evidence/task923/r6-planted-mojibake.md';
const mode = process.argv[2];
console.log(`platform ${process.platform} node ${process.version}`);

if (mode === 'bytes') {
  const r = spawnSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: process.cwd(), encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  console.log(`listing bytes: ${Buffer.byteLength(r.stdout, 'utf8')} (spawnSync default maxBuffer ${1024 * 1024}); files listed ${r.stdout.split('\n').filter(Boolean).length}; status ${r.status}`);
  console.log(Buffer.byteLength(r.stdout, 'utf8') > 1024 * 1024 ? 'the listing is larger than the 1 MiB default' : 'the listing is NOT larger than the 1 MiB default');
} else if (mode === 'plant') {
  const mojibake = String.fromCharCode(0xe2, 0x20ac, 0x201c);
  writeFileSync(PLANTED, `# planted mojibake (Task 923 R27 / AC27 test file, deleted after the check)\n\nA pause ${mojibake} planted.\n`, 'utf8');
  console.log(`wrote ${PLANTED} (${[...mojibake].map((c) => 'U+' + c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')).join(' ')})`);
} else if (mode === 'unplant') {
  if (existsSync(PLANTED)) unlinkSync(PLANTED);
  console.log(`${PLANTED} exists: ${existsSync(PLANTED)}`);
} else {
  throw new Error('mode: bytes | plant | unplant');
}
