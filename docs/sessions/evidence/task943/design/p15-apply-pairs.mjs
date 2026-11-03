// Applies @@FROM/@@TO/@@END replacement pairs (raw text, no escape processing) to a file; every anchor must occur once.
import { readFileSync, writeFileSync } from 'node:fs';
const [file, pairsFile] = process.argv.slice(2);
let src = readFileSync(file, 'utf8');
const blocks = readFileSync(pairsFile, 'utf8').split(/^@@FROM\n/m).slice(1);
for (const block of blocks) {
  const [from, rest] = block.split(/^@@TO\n/m);
  const to = rest.split(/^@@END\n?/m)[0];
  const a = from.replace(/\n$/, ''), b = to.replace(/\n$/, '');
  const count = src.split(a).length - 1;
  if (count !== 1) throw new Error(`anchor occurs ${count} times: ${a.slice(0, 100)}`);
  src = src.replace(a, () => b);
}
writeFileSync(file, src);
console.log(`applied ${blocks.length} pairs`);
