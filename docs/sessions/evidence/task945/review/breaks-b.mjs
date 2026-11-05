// Task 945 independent review, second set: the real registry on a small fixture whose node_modules is a junction to this project's,
// deleted consumers, and whether "no file on disk changes" holds when a mutant runs.
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const ROOT = 'C:/Claude_Code_Projects/lero-al';
const TOOL = 'scripts/workflow-gates/code-check.mjs';
const REGISTRY = 'scripts/workflow-gates/code-check.json';
const made = [];
function chain(extra) {
  const root = mkdtempSync(join(tmpdir(), 'lero-945-review-chain-'));
  made.push(root);
  const put = (file, text) => { mkdirSync(dirname(join(root, file)), { recursive: true }); writeFileSync(join(root, file), text); };
  for (const file of ['eslint.config.mjs', 'tsconfig.json', 'vitest.config.ts', 'src/tests/setup.ts', 'src/tests/server-only-stub.ts', 'src/tests/next-cache-stub.ts', 'scripts/check-file-integrity.mjs',
    'scripts/check-design-tokens.mjs', 'scripts/design-tokens-allowlist.json', 'scripts/lib/mantine-story-scope.mjs', 'scripts/check-i18n-parity.mjs', 'scripts/check-mojibake.mjs', 'scripts/mojibake-allowlist.json', TOOL, 'scripts/workflow-gates/selftests.mjs', 'scripts/workflow-gates/contract.mjs', 'scripts/workflow-gates/mutation-check.mjs', 'scripts/workflow-gates/mutation-loader.mjs', 'scripts/workflow-gates/mutation-vitest.config.mjs', 'scripts/workflow-gates/dependency-check.mjs']) {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    copyFileSync(join(ROOT, file), join(root, file));
  }
  const registry = JSON.parse(readFileSync(join(ROOT, REGISTRY), 'utf8'));
  put(REGISTRY, JSON.stringify(extra.keepMutation ? registry : { ...registry, mutation: undefined }));
  symlinkSync(join(ROOT, 'node_modules'), join(root, 'node_modules'), 'junction');
  const base = { '.gitignore': 'node_modules\ntest-results\n*.tsbuildinfo\n', 'next-env.d.ts': '/// <reference types="next" />\n', 'package.json': '{ "name": "fixture", "private": true, "type": "module" }\n',
    'scripts/workflow-gates/fixture.selftest.mjs': "import { test } from 'node:test';\ntest('fixture', () => {});\n", ...extra.files };
  for (const [file, text] of Object.entries(base)) put(file, text);
  const git = (...args) => spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  git('init', '-q'); git('config', 'core.autocrlf', 'false'); git('add', '-A');
  git('-c', 'user.name=f', '-c', 'user.email=f@example.com', 'commit', '-qm', 'base');
  const hook = (name, file) => spawnSync(process.execPath, [join(root, TOOL)], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 26, timeout: 200000, env: { ...process.env, CLAUDE_PROJECT_DIR: root },
    input: JSON.stringify({ hook_event_name: name, session_id: 's', cwd: root, ...(file ? { tool_name: 'Edit', tool_input: { file_path: join(root, file) } } : {}) }) });
  return { root, put, git, hook };
}
const say = (...a) => console.log(...a);

say('=== D1 a deleted shared library of the scanners, with a consumer script and its test, never written');
{
  const c = chain({ files: {
    'scripts/lib/shared.mjs': 'export const limit = () => 3;\n',
    'scripts/check-thing.mjs': "import { limit } from './lib/shared.mjs';\nexport const over = value => value > limit();\n",
    'scripts/__tests__/check-thing.test.ts': "import { it, expect } from 'vitest';\nimport { over } from '../check-thing.mjs';\nit('over', () => expect(over(4)).toBe(true));\n",
  } });
  say('SessionStart', c.hook('SessionStart').status);
  const proof = spawnSync(process.execPath, ['node_modules/vitest/vitest.mjs', 'run', 'scripts/__tests__/check-thing.test.ts', '--reporter=dot'], { cwd: c.root, encoding: 'utf8', timeout: 120000 });
  say('the test passes before:', proof.status);
  rmSync(join(c.root, 'scripts/lib/shared.mjs'));
  const write = c.hook('PostToolUse');
  say('after the deletion, PostToolUse', write.status);
  const stop = c.hook('Stop');
  say('Stop', stop.status, JSON.stringify(stop.stderr.slice(0, 200)));
  const after = spawnSync(process.execPath, ['node_modules/vitest/vitest.mjs', 'run', 'scripts/__tests__/check-thing.test.ts', '--reporter=dot'], { cwd: c.root, encoding: 'utf8', timeout: 120000 });
  say('the same test now, run by hand: exit', after.status, /Failed to load|Cannot find|does the file exist/i.test(after.stdout + after.stderr) ? '(fails to load the deleted file)' : '');
}

say('\n=== D2 a deleted CSS module and a deleted JSON file, each imported by a source file never written');
{
  const c = chain({ files: {
    'src/lib/box.module.css': '.box { color: var(--mantine-color-text); }\n',
    'src/lib/Box.tsx': "import styles from './box.module.css';\nexport const Box = () => <div className={styles.box} />;\n",
    'src/lib/data.json': '{ "a": 1 }\n',
    'src/lib/uses-data.ts': "import data from './data.json';\nexport const a = data.a;\n",
  } });
  c.hook('SessionStart');
  rmSync(join(c.root, 'src/lib/box.module.css'));
  say('CSS module deleted: PostToolUse', c.hook('PostToolUse').status, '| Stop', c.hook('Stop').status);
  c.git('checkout', '-q', '--', '.');
  rmSync(join(c.root, 'test-results/code-check/s.json'), { force: true });
  c.hook('SessionStart');
  rmSync(join(c.root, 'src/lib/data.json'));
  const post = c.hook('PostToolUse');
  const stop = c.hook('Stop');
  say('JSON file deleted: PostToolUse', post.status, '| Stop', stop.status, '(tsc by hand:', spawnSync(process.execPath, ['node_modules/typescript/bin/tsc', '--noEmit', '--pretty', 'false'], { cwd: c.root, encoding: 'utf8', timeout: 120000 }).stdout.split('\n').filter(l => /data/.test(l)).join(' ').slice(0, 120), ')');
}

say('\n=== F1 "no file on disk changes": a scanner with an update flag, under a test that spawns it, through the real mutation check');
{
  const scanner = "import { writeFileSync } from 'node:fs';\nconst update = process.argv.includes('--update');\nif (update) writeFileSync('scripts/baseline.json', JSON.stringify({ wiped: true }));\nconsole.log(update ? 'updated' : 'checked');\n";
  const test = "import { spawnSync } from 'node:child_process';\nimport { it, expect } from 'vitest';\nit('runs', () => { expect(spawnSync(process.execPath, ['scripts/check-update.mjs'], { encoding: 'utf8' }).status).toBe(0); });\n";
  const c = chain({ keepMutation: true, files: { 'scripts/check-update.mjs': scanner, 'scripts/baseline.json': '{"entries":[1,2,3]}\n', 'scripts/__tests__/check-update.test.ts': test } });
  const before = readFileSync(join(c.root, 'scripts/baseline.json'), 'utf8');
  const run = spawnSync(process.execPath, [join(ROOT, 'scripts/workflow-gates/mutation-check.mjs'), '--all', '--minutes=2', 'scripts/check-update.mjs'], { cwd: c.root, encoding: 'utf8', timeout: 200000, env: { ...process.env, CLAUDE_PROJECT_DIR: c.root } });
  say(run.stdout.split('\n').slice(0, 6).join('\n').slice(0, 500));
  const now = readFileSync(join(c.root, 'scripts/baseline.json'), 'utf8');
  say('the tracked baseline changed on disk:', now !== before, JSON.stringify(now));
  say('git status of the fixture:', c.git('status', '--short', '--', 'scripts').stdout.trim());
}

for (const root of made) {
  const link = join(root, 'node_modules');
  spawnSync('cmd', ['/c', 'rmdir', link]);
  if (!existsSync(link)) rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  else say('LEFT', root);
}
