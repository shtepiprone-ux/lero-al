// Task 945 review, self-audit. Proves, in memory, the correction Task 942 R15 names for check:surface-census:changed: the limit counts the
// files the mapper can census, after they are classified, instead of every changed path. No file changes: the correction reaches the gate through
// the sensitivity register. Run from the repository root. The runner is a policy path, so this stays a governance change; the mapper is unchanged.
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = resolve('.');
const OUT = join(ROOT, 'test-results/task945-review/out');
mkdirSync(OUT, { recursive: true });
const GATE = 'scripts/check-surface-census-changed.mjs';
const FIND = 'const mapping = mappingFn({ base, head, maxChangedFiles, maxSurfaces });\n  if (mapping.failClosed) {';
const REPLACE = "const mapped = mappingFn({ base, head, maxChangedFiles: Infinity, maxSurfaces });\n  const over = !mapped.failClosed && (mapped.candidates?.length ?? 0) > maxChangedFiles;\n  const mapping = over ? { failClosed: true, reason: 'changed-file-limit-exceeded', detail: `${mapped.candidates.length} changed candidate file(s) exceeds the limit of ${maxChangedFiles}`, changedCount: mapped.changedCount, limit: maxChangedFiles } : mapped;\n  if (mapping.failClosed) {";
const spec = join(OUT, 'p04-census.break.json');
writeFileSync(spec, JSON.stringify({ version: 1, case: 'p04', target: GATE, find: FIND, replace: REPLACE }));
const env = { ...process.env, NODE_OPTIONS: `--import=${pathToFileURL(join(ROOT, 'scripts/workflow-gates/sensitivity-register.mjs')).href}`, SENSITIVITY_BREAK: spec };
const base = execFileSync('git', ['merge-base', 'origin/main', 'HEAD'], { encoding: 'utf8' }).trim();
const tail = text => text.split('\n').filter(Boolean).filter(l => /FAIL|PASS|Changed paths|Excluded \(|Included|Candidates|arms|census:changed/.test(l)).slice(0, 6).map(l => `  ${l.slice(0, 170)}`).join('\n');

console.log('=== the gate as committed, on the real branch');
let r = spawnSync('node', [GATE, '--base', base, '--head', 'HEAD'], { encoding: 'utf8', maxBuffer: 1 << 28 });
console.log(`exit ${r.status}\n${tail(r.stdout + r.stderr)}`);
console.log('=== with the correction in memory, on the real branch, limit as committed');
r = spawnSync('node', [GATE, '--base', base, '--head', 'HEAD'], { encoding: 'utf8', maxBuffer: 1 << 28, env });
console.log(`exit ${r.status}\n${tail(r.stdout + r.stderr)}`);
console.log('=== with the correction in memory, the gate self-test');
r = spawnSync('node', [GATE, '--verify-gate'], { encoding: 'utf8', maxBuffer: 1 << 28, env });
console.log(`exit ${r.status}\n${tail(r.stdout + r.stderr)}`);
console.log('=== with the correction in memory, the limit still refuses what can be censused');
const probe = `
import { runPipeline } from ${JSON.stringify(pathToFileURL(join(ROOT, GATE)).href)};
const names = n => Array.from({ length: n }, (_, i) => 'src/app/p' + i + '/page.tsx');
const mapping = n => ({ failClosed: false, base: 'x', head: 'y', mergeBase: 'x', changedCount: n, excluded: [], included: [], candidates: names(n), limits: {}, graphFileCount: 0 });
const baseline = () => ({ blocks: {} });
const census = () => ({ blocks: [] });
const run = n => runPipeline({ base: 'x', head: 'y', maxChangedFiles: 300, maxSurfaces: 60 }, census, () => true, () => mapping(n), baseline);
for (const n of [0, 300, 301, 2000]) { const out = run(n); console.log(n + ' candidates: failClosed ' + Boolean(out.failClosed) + (out.failClosed ? ', ' + out.mapping.reason + ': ' + out.mapping.detail : '')); }
const excludedOnly = runPipeline({ base: 'x', head: 'y', maxChangedFiles: 300, maxSurfaces: 60 }, census, () => true, () => ({ ...mapping(0), changedCount: 5000 }), baseline);
console.log('5000 changed paths, none a candidate: failClosed ' + Boolean(excludedOnly.failClosed));
const asked = []; runPipeline({ base: 'x', head: 'y', maxChangedFiles: 300, maxSurfaces: 60 }, census, () => true, args => { asked.push(args.maxChangedFiles); return mapping(1); }, baseline);
console.log('the mapper is asked with limit ' + asked[0]);
process.exit(0);
`;
const file = join(OUT, 'p04-probe.mjs');
writeFileSync(file, probe);
r = spawnSync('node', [file], { encoding: 'utf8', maxBuffer: 1 << 28, env });
console.log(`exit ${r.status}\n${(r.stdout + r.stderr).split('\n').filter(Boolean).slice(0, 12).map(l => `  ${l.slice(0, 190)}`).join('\n')}`);
console.log('=== the tree after these runs');
console.log(JSON.stringify(execFileSync('git', ['status', '--short', '--', GATE, 'scripts/map-changed-surfaces.mjs'], { encoding: 'utf8' })));
