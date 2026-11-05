// Task 945 review 1: executed prototype of the corrections the kickoff revision names. Design evidence to read, not code to paste. Runs on temporary
// fixture repositories and reads the real tree without writing to it. Prints file, line and rule only, never a matched secret.
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

const ROOT = resolve('.');
const glue = (...parts) => parts.join('');
const registry = JSON.parse(readFileSync(join(ROOT, 'scripts/workflow-gates/code-check.json'), 'utf8'));
const refuse = registry.secure.filter(rule => rule.refuse).map(rule => ({ name: (rule.what || rule.name || '').split(' (')[0], re: new RegExp(rule.pattern, rule.flags || '') }));
const say = (...a) => console.log(...a);
const made = [];
function repo(files) {
  const root = mkdtempSync(join(tmpdir(), 'lero-945-p01-'));
  made.push(root);
  const put = (file, text) => { mkdirSync(dirname(join(root, file)), { recursive: true }); writeFileSync(join(root, file), text); };
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28 });
  git('init', '-q'); git('config', 'core.autocrlf', 'false');
  for (const [file, text] of Object.entries(files)) put(file, text);
  git('add', '-A'); git('-c', 'user.name=f', '-c', 'user.email=f@example.com', 'commit', '-qm', 'base');
  return { root, put, git };
}

say('=== A. package names: an allowlist before any command line');
const NAME = /^(?:@[A-Za-z0-9~-][A-Za-z0-9._~-]*\/)?[A-Za-z0-9~-][A-Za-z0-9._~-]*$/;
const manifest = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const lock = JSON.parse(readFileSync(join(ROOT, 'package-lock.json'), 'utf8'));
const direct = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'].flatMap(section => Object.keys(manifest[section] || {}));
const locked = Object.keys(lock.packages).filter(Boolean).map(path => path.split('node_modules/').pop());
say(`real names refused by the allowlist: direct ${direct.filter(name => !NAME.test(name)).length} of ${direct.length}; locked ${locked.filter(name => !NAME.test(name)).length} of ${locked.length}`);
for (const hostile of ['left-pad&echo ran>x&rem ', 'a|b', 'a;b', 'a b', '$(x)', '%PATH%', '"a"', 'a\nb', '../x']) say(`hostile ${JSON.stringify(hostile)}: ${NAME.test(hostile) ? 'ACCEPTED' : 'refused'}`);

say('\n=== B. the lock file: entries that fetch with no hash, on the real lock');
const rows = Object.entries(lock.packages).filter(([path, entry]) => path && !entry.link);
say(`entries ${rows.length}; neither resolved nor integrity ${rows.filter(([, e]) => !e.resolved && !e.integrity).length}; resolved no integrity ${rows.filter(([, e]) => e.resolved && !e.integrity).length}; integrity no resolved ${rows.filter(([, e]) => !e.resolved && e.integrity).length}`);

say('\n=== C. secrets: every added line of the diff, whatever file holds it, by one git diff');
const LIVE = glue('sk_', 'live_', 'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6');
const OTHER = glue('sk_', 'live_', 'Z9y8X7w6V5u4T3s2R1q0P9o8N7m6L5k4');
const addedSecrets = (root, base) => {
  const hits = [];
  const text = execFileSync('git', ['-c', 'core.quotePath=false', 'diff', '--unified=0', '--no-color', '--no-ext-diff', '--no-renames', base], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 30 });
  let file = '', line = 0;
  for (const raw of text.split('\n')) {
    if (raw.startsWith('+++ ')) { file = raw.slice(raw.startsWith('+++ b/') ? 6 : 4); continue; }
    const hunk = /^@@ -\S+ \+(\d+)/.exec(raw);
    if (hunk) { line = Number(hunk[1]); continue; }
    if (raw.startsWith('+')) { for (const rule of refuse) if (rule.re.test(raw)) hits.push({ file, line, rule: rule.name }); line++; }
  }
  for (const name of execFileSync('git', ['ls-files', '--others', '--exclude-standard', '-z'], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28 }).split('\0').filter(Boolean)) {
    const bytes = readFileSync(join(root, name));
    if (bytes.length > 8 << 20 || bytes.subarray(0, 8000).includes(0)) continue;
    bytes.toString('utf8').split('\n').forEach((value, index) => { for (const rule of refuse) if (rule.re.test(value)) hits.push({ file: name, line: index + 1, rule: rule.name }); });
  }
  return hits;
};
{
  const places = ['docs/note.md', 'supabase/seed.sql', 'scripts/setup.sh', '.env.example', 'src/lib/data.json', 'public/config.txt', '.github/actions/x/action.yml', 'src/lib/notes.md', 'supabase/functions/x/index.ts', 'tests/a.ts', 'src/lib/caf\u00e9.ts'];
  const r = repo({ 'README.md': 'x\n' });
  for (const place of places) r.put(place, `const a = "${LIVE}";\n`);
  const untracked = addedSecrets(r.root, 'HEAD');
  say(`untracked, ${places.length} places: named ${new Set(untracked.map(h => h.file)).size}`);
  r.git('add', '-A');
  const staged = addedSecrets(r.root, 'HEAD');
  say(`staged, ${places.length} places: named ${new Set(staged.map(h => h.file)).size}; the café file named as itself: ${staged.some(h => h.file === 'src/lib/caf\u00e9.ts')}`);
  say('the key in the result:', JSON.stringify(staged).includes(LIVE));
  r.git('-c', 'user.name=f', '-c', 'user.email=f@example.com', 'commit', '-qm', 'k');
  r.put('docs/note.md', `const a = "${OTHER}";\n`);
  const swapped = addedSecrets(r.root, 'HEAD');
  say(`one key replaced by another: named ${swapped.length} (the count of code-check.mjs:66 sees 1 and 1)`);
  r.put('docs/note.md', `const a = "${LIVE}";\nconst b = 1;\n`);
  say(`an old key left in place, a line added: named ${addedSecrets(r.root, 'HEAD').length}`);
}
{
  const begun = Date.now();
  const diff = execFileSync('git', ['-c', 'core.quotePath=false', 'diff', '--unified=0', '--no-color', '--no-ext-diff', '--no-renames', 'origin/main...HEAD'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 30 }).split('\n');
  const added = diff.filter(line => line.startsWith('+') && !line.startsWith('+++ '));
  const hits = added.filter(line => refuse.some(rule => rule.re.test(line))).length;
  say(`the real branch against origin/main: ${added.length} added lines, ${hits} hits, ${Date.now() - begun} ms`);
}

say('\n=== D. git diff names: -z against the form change-review.mjs:33 parses');
{
  const r = repo({ 'README.md': 'x\n' });
  r.put('src/lib/caf\u00e9.ts', 'export const a = 1;\n');
  r.git('add', '-A');
  const plain = r.git('diff', '--no-renames', '--name-only', 'HEAD', '--', 'src').split(/\r?\n/).filter(Boolean);
  const zero = r.git('diff', '--no-renames', '--name-only', '-z', 'HEAD', '--', 'src').split('\0').filter(Boolean);
  say('without -z:', JSON.stringify(plain));
  say('with -z:', JSON.stringify(zero));
}

say('\n=== E. a deleted file: what still names it, by one git grep over the roots');
const STEM_FORMS = file => {
  const base = file.split('/').pop();
  const stem = base.replace(/\.[^.]+$/, '');
  return [base, ...(/\.(?:[cm]?[jt]sx?)$/.test(base) && !/^index\./.test(base) ? [stem] : [])];
};
const stillNaming = (root, file, roots) => {
  const hits = new Set();
  for (const form of STEM_FORMS(file)) {
    const pattern = `[/'"\`]${form.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`]`;
    const run = spawnSync('git', ['grep', '-l', '-E', '-e', pattern, '--', ...roots], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 26 });
    for (const name of run.stdout.split(/\r?\n/).filter(Boolean)) if (name !== file && existsSync(join(root, name))) hits.add(name);
  }
  return [...hits];
};
{
  const r = repo({ 'scripts/lib/shared.mjs': 'export const limit = () => 3;\n', 'scripts/check-thing.mjs': "import { limit } from './lib/shared.mjs';\nexport const over = value => value > limit();\n", 'src/lib/data.json': '{ "a": 1 }\n', 'src/lib/uses-data.ts': "import data from './data.json';\nexport const a = data.a;\n", 'src/lib/box.module.css': '.box { color: red; }\n', 'src/lib/Box.tsx': "import styles from './box.module.css';\nexport const Box = () => <div className={styles.box} />;\n", 'src/lib/plain.ts': 'export const p = 1;\n', 'src/lib/uses-plain.ts': "import { p } from './plain';\nexport const q = p;\n", 'src/lib/lonely.ts': 'export const l = 1;\n' });
  const roots = ['src', 'scripts'];
  for (const file of ['scripts/lib/shared.mjs', 'src/lib/data.json', 'src/lib/box.module.css', 'src/lib/plain.ts', 'src/lib/lonely.ts']) {
    rmSync(join(r.root, file));
    say(`${file}: still named by ${JSON.stringify(stillNaming(r.root, file, roots))}`);
    r.git('checkout', '-q', '--', file);
  }
}
{
  const roots = registry.roots;
  const deleted = execFileSync('git', ['-c', 'core.quotePath=false', 'diff', '--name-only', '--diff-filter=D', '-z', 'origin/main...HEAD', '--', ...roots], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 }).split('\0').filter(Boolean);
  const begun = Date.now();
  const named = deleted.map(file => [file, stillNaming(ROOT, file, roots)]).filter(([, list]) => list.length);
  say(`the real branch: ${deleted.length} files deleted under the roots; ${named.length} still named, ${Date.now() - begun} ms`);
  for (const [file, list] of named.slice(0, 10)) say(`  ${file}: ${list.slice(0, 3).join(', ')}`);
}

{
  // No file is deleted on this branch, so the false-positive rate comes from history: code files deleted in the last 400 commits and absent today.
  const roots = registry.roots;
  const seen = execFileSync('git', ['-c', 'core.quotePath=false', 'log', '-400', '--diff-filter=D', '--name-only', '--format=', '-z', '--', ...roots], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28 }).split('\0').map(name => name.trim()).filter(Boolean);
  const gone = [...new Set(seen)].filter(file => !existsSync(join(ROOT, file)));
  const begun = Date.now();
  const named = gone.map(file => [file, stillNaming(ROOT, file, roots)]).filter(([, list]) => list.length);
  say(`history: ${gone.length} files deleted and absent today; ${named.length} still named by some file, ${Date.now() - begun} ms`);
  for (const [file, list] of named.slice(0, 12)) say(`  ${file}: ${list.slice(0, 2).join(', ')}`);
}

say('\n=== F. a whole-tree gate: a finding has the form its gate gives, a crash has not');
const FORMS = { 'node scripts/check-mojibake.mjs': /^\s+\S+:\d+:\d+\s/, 'node scripts/check-design-tokens.mjs --strict': /^\s+\S+\s+\(\d+\)\s*$/ };
for (const [command, form] of Object.entries(FORMS)) {
  const run = spawnSync(command, { cwd: ROOT, shell: true, encoding: 'utf8', maxBuffer: 1 << 28, timeout: 120000 });
  const lines = `${run.stdout}${run.stderr}`.split(/\r?\n/);
  say(`${command}: exit ${run.status}; lines of the finding form ${lines.filter(line => form.test(line)).length} of ${lines.length}`);
}
const crash = 'Error: Cannot find module x\n    at run (scripts/check-mojibake.mjs:12:3)\n    at file:///C:/p/scripts/check-design-tokens.mjs:9:1\n  scripts/check-mojibake.mjs\n';
for (const [command, form] of Object.entries(FORMS)) say(`a crash that names a real file, ${command}: lines of the finding form ${crash.split('\n').filter(line => form.test(line)).length}`);

for (const root of made) rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
