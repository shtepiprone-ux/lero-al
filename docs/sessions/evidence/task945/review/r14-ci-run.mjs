// Task 945 review 1: why CI run 41823787040 failed. Reads the static artifact downloaded read-only with gh and prints each failed command with its elapsed seconds.
import { readFileSync } from 'node:fs';
const [path] = process.argv.slice(2);
const { group, complete, results } = JSON.parse(readFileSync(path, 'utf8'));
console.log(`group ${group}, complete ${complete}, ${results.length} commands, ${results.filter(r => r.code !== 0).length} failed, ${Math.round(results.reduce((n, r) => n + r.elapsedMs, 0) / 1000)} s in all`);
for (const r of results.filter(item => item.code !== 0)) console.log(`failed: exit ${r.code} ${Math.round(r.elapsedMs / 1000)} s: ${r.command.join(' ').slice(0, 110)}`);
const selftests = results.find(r => r.command.join(' ').includes('selftests.mjs'));
if (selftests) console.log(`selftests.mjs on CI, the older suite: exit ${selftests.code}, ${Math.round(selftests.elapsedMs / 1000)} s`);
