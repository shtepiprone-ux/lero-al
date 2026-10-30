// Task 923 Revision 40 evidence helper: node r40-sha.mjs <path>... prints "<sha256>  <path>" (plain file bytes) or "ABSENT  <path>"
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';

for (const p of process.argv.slice(2)) {
  if (!existsSync(p)) { console.log(`ABSENT  ${p}`); continue; }
  console.log(`${createHash('sha256').update(readFileSync(p)).digest('hex')}  ${p}`);
}
