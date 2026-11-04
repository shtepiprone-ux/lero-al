// Task 937 revision 3 probe (Opus, Task 944 review 4 session, read-only): which tracked files check:mojibake lists, and that the two
// allowlist paths of R2 and the file R3 repairs leave no tracked file. CI scans tracked files only, so untracked evidence of other
// sessions is named separately. R3's repair is stood in for by a memory-only allowlist entry; no project file is written. It prints
// paths and counts, never the flagged text. Usage (project root): node docs/sessions/evidence/task937/design/p11-third-mojibake-run.mjs
import { execFileSync, spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../../../../..', import.meta.url)));
const PRELOAD = pathToFileURL(resolve(ROOT, 'docs/sessions/evidence/task937/design/p11-allowlist-preload.mjs')).href;
const R2 = ['docs/sessions/evidence/task923/r33-13a-mojibake.txt', 'docs/sessions/evidence/task944/review/r3-q1-integrity.txt'];
const R3 = 'docs/sessions/evidence/task927/base/unit-base-failures.txt';
const tracked = file => { try { execFileSync('git', ['cat-file', '-e', `HEAD:${file}`], { cwd: ROOT, stdio: 'ignore' }); return true; } catch { return false; } };
function run(name, environment) {
  const child = spawnSync(process.execPath, ['scripts/check-mojibake.mjs'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28, env: { ...process.env, ...environment } });
  const output = `${child.stdout}\n${child.stderr}`;
  const files = [...new Set([...output.matchAll(/^ {2}([^\s:]+\.[A-Za-z0-9]+)\r?$/gm)].map(match => match[1]))].filter(file => !file.includes('Sprint_92_kickoff_prompt_Task_944'));
  const inTree = files.filter(tracked);
  console.log(`${name}: exit ${child.status}; files listed ${files.length}; tracked at HEAD ${inTree.length}`);
  for (const file of inTree) console.log(`  tracked: ${file}`);
  for (const file of files.filter(item => !inTree.includes(item))) console.log(`  untracked, other sessions: ${file}`);
}
console.log(`node ${process.version}; platform ${process.platform}; cwd ${ROOT}; HEAD ${execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim()}`);
run('A live allowlist', {});
run('B allowlist with both R2 paths and the R3 file, in memory', { NODE_OPTIONS: `--import=${PRELOAD}`, P11_ALLOW: JSON.stringify([...R2, R3]) });
run('C allowlist with only the first R2 path and the R3 file, in memory', { NODE_OPTIONS: `--import=${PRELOAD}`, P11_ALLOW: JSON.stringify([R2[0], R3]) });
