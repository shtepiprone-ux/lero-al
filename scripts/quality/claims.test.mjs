// node --test scripts/quality/claims.test.mjs
// The CI-claim check and the corpus that keeps it current (owner, 2026-11-10: "claims can change, so a tool that keeps
// the tests up to date is needed"). The cases below are written from the wording found in this project's transcripts
// (2026-11-10 harvest: 137 replies of turns that looked at CI, 107 caught, 30 judged); the transcripts themselves stay
// on the machine (claims.mjs corpusFile), so no reply text is committed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CI_TOOL, ciVocabulary, corpusProblems, entryId, harvest, loadVocabulary, looksAtCi, mentionsCi, transcriptDirs, turnsOf } from './claims.mjs';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const vocab = loadVocabulary(ROOT);

test('the vocabulary follows ci.yml: every job name and hyphenated job id, the tools, no descriptive phrase', () => {
  const doc = require('js-yaml').load(readFileSync(path.join(ROOT, '.github', 'workflows', 'ci.yml'), 'utf8'));
  for (const [id, job] of Object.entries(doc.jobs)) {
    const name = job.name.replace(/\s*\(\$\{\{[^}]*\}\}\/\d+\)/, '');
    assert.ok(mentionsCi(`Перевірка «${name}» завершилась`, vocab), `job ${id} by name`);
    if (id.includes('-')) assert.ok(mentionsCi(`${id} теж`, vocab), `job ${id} by id`);
  }
  for (const v of vocab) assert.ok(v.split(/\s+/).length <= 12 && !/^(real|high|new|sensitive|production|weakened|an) /.test(v), `no descriptive phrase as a term: ${v}`);
  const planted = ciVocabulary({ jobs: { 'new-gate': { name: 'Brand new gate (frobnicator)' } } });
  assert.ok(planted.includes('new-gate') && planted.includes('frobnicator') && planted.includes('Brand new gate'), 'a job added to ci.yml is in the vocabulary at once');
});

// Wordings of CI results in this project's replies (paraphrased from the harvest), each must be caught by its words.
const CI_CLAIMS = [
  'CI на PR #28 зелений.',
  'Пул-реквест пройшов усі перевірки.',
  'Запуск `37668475795` ще йде, результату поки немає.',
  'Шард 5 ще працює (~10 хв); дочекаюсь сповіщення.',
  'Чекаю на шарди 1/6 і 4/6.',
  'Locale leak 2/6 теж червоний, причина та сама.',
  'locale-leak 2/6 failed again.',
  'Монітор запущено; повідомлю результати кожного job.',
  'Розберу кожен червоний джоб.',
  '`CI Required` очікувано буде червоним.',
  'Vercel deployment failed on the preview.',
  'CodeQL alerts: none in the changed files.',
  'Lint, types and product checks впав на тестах quality-скриптів.',
  'Unit and component tests took 10 min 54 s.',
  'gitleaks and zizmor are green.',
  'the OWASP task gate is red',
  'see https://github.com/o/r/actions/runs/42820908081 for the log',
  'I ran `gh pr checks 28` and everything passed.',
  'The pull request is mergeable now.',
];
// Replies that state no CI result and name no check: they need no ci-status line by their words.
const NOT_CI = [
  'Тести хука: 6 з 6, тимчасові файли прибрано.',
  'Пробна збірка зі stub пройшла (exit 0).',
  'Kickoff 937 пройшов перевірки. Пишу sidecar 937.',
  'Усе гаразд, можна продовжувати.',
  'Перераховую дайджест і запускаю повну фінальну перевірку.',
];

test('every known wording of a CI result is caught by its words; plain local reports are not', () => {
  for (const t of CI_CLAIMS) assert.ok(mentionsCi(t, vocab), `missed: ${t}`);
  for (const t of NOT_CI) assert.equal(mentionsCi(t, vocab), false, `caught without a mention: ${t}`);
});

test('a turn looked at CI when one of its tool calls read checks, runs or the Actions API', () => {
  for (const c of ['gh pr checks 28', 'gh pr view 28 --json statusCheckRollup', 'gh run view 42820908081 --log', 'gh run watch 1 --exit-status', 'gh api repos/o/r/actions/jobs/1/logs', 'node scripts/quality/pipeline.mjs ci-status 28']) {
    assert.ok(CI_TOOL.test(c), c);
  }
  for (const c of ['gh auth token', 'git log --oneline -3', 'npm test']) assert.equal(CI_TOOL.test(c), false, c);
  const jsonl = [
    { type: 'user', message: { content: 'як CI?' } },
    { type: 'assistant', message: { content: [{ type: 'tool_use', input: { command: 'gh pr checks 28' } }] } },
    { type: 'assistant', message: { content: [{ type: 'text', text: 'Усе гаразд.' }] } },
    { type: 'user', message: { content: [{ type: 'text', text: 'далі' }] } },
    // a file write whose content holds such a command is no look at CI (found 2026-11-10: a test file was counted)
    { type: 'assistant', message: { content: [{ type: 'tool_use', name: 'Write', input: { file_path: 'x.test.mjs', content: "assert('gh pr checks 28')" } }] } },
    { type: 'assistant', message: { content: [{ type: 'text', text: 'Пишу тест.' }] } },
  ].map((e) => JSON.stringify(e)).join('\n');
  assert.deepEqual(turnsOf(jsonl), [{ reply: 'Усе гаразд.', ci: true }, { reply: 'Пишу тест.', ci: false }]);
  assert.equal(looksAtCi({ type: 'tool_use', name: 'PowerShell', input: { command: 'gh run list --limit 3' } }), true);
  assert.equal(looksAtCi({ type: 'tool_use', name: 'Edit', input: { new_string: 'gh run list' } }), false);
});

test('the corpus judges itself: unlabeled, a missed ci entry and a judgement without a reason are problems', () => {
  const e = (text, label, reason) => ({ id: entryId(text), text, label, reason });
  assert.deepEqual(corpusProblems([e('CI is green on PR #1', 'ci'), e('Усе гаразд.', 'none', 'the reply states no CI result')], vocab), []);
  const p = corpusProblems([e('x happened', 'unlabeled'), e('Усе зелене.', 'ci'), e('Усе гаразд.', 'none', 'short'), e('y', 'maybe')], vocab).join('\n');
  assert.match(p, /unlabeled/);
  assert.match(p, /CI claim that mentionsCi misses/, 'a ci judgement the detector misses keeps the check red until the detector is widened');
  assert.match(p, /at least five words/);
  assert.match(p, /unknown label/);
  const amb = (text) => corpusProblems([e(text, 'ambiguous', 'the words cannot say CI or local here')], vocab).join('\n');
  assert.equal(amb('Маю 17 провалених тестів у 7 файлах.'), '', 'an ambiguous result is read as a result, so it needs its source tag');
  assert.match(amb('Waiting for the matrix pass to finish.'), /does not read as a result/);
});

test('harvest adds every new reply of a turn that looked at CI, labelled by behaviour, from every local configuration', () => {
  const home = mkdtempSync(path.join(os.tmpdir(), 'claims-home-'));
  const root = mkdtempSync(path.join(os.tmpdir(), 'claims-repo-'));
  spawnSync('git', ['init', '-q'], { cwd: root });
  mkdirSync(path.join(root, '.github', 'workflows'), { recursive: true });
  writeFileSync(path.join(root, '.github', 'workflows', 'ci.yml'), 'jobs:\n  lint:\n    name: Lint\n');
  const slug = path.resolve(root).replace(/[^A-Za-z0-9]/g, '-');
  for (const cfg of ['.claude', '.claude-account2']) mkdirSync(path.join(home, cfg, 'projects', slug), { recursive: true });
  const turn = (tool, text) => [
    JSON.stringify({ type: 'user', message: { content: 'q' } }),
    JSON.stringify({ type: 'assistant', message: { content: [{ type: 'tool_use', input: { command: tool } }, { type: 'text', text }] } }),
  ].join('\n');
  writeFileSync(path.join(home, '.claude', 'projects', slug, 'a.jsonl'), turn('gh pr checks 3', 'Lint is red on PR #3'));
  writeFileSync(path.join(home, '.claude-account2', 'projects', slug, 'b.jsonl'), `${turn('gh run view 1', 'Усе зелене.')}\n${turn('npm test', 'Тести пройшли.')}`);
  assert.equal(transcriptDirs(root, home).length, 2);
  const found = harvest({ root, home, corpus: [] });
  assert.deepEqual(found.map((f) => [f.text, f.label]).sort(), [['Lint is red on PR #3', 'ci'], ['Усе зелене.', 'unlabeled']]);
  assert.deepEqual(harvest({ root, home, corpus: found }), [], 'a reply already in the corpus is not added again');
  rmSync(home, { recursive: true, force: true });
  rmSync(root, { recursive: true, force: true });
});
