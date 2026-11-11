// node --test scripts/quality/provenance.test.mjs
// Every stated result names its source, and the source is checked (owner, 2026-11-10: "a tool that records whether it
// is CI or a local run, so we avoid the confusion").
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { numbersOf, provenanceFindings, resultLines } from './provenance.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

test('result lines: counts, exit codes and status words about checks; plain prose and code blocks are not results', () => {
  const results = [
    'Маю 17 провалених тестів у 7 файлах.', // the ambiguous reply of the 2026-11-10 harvest: CI or local, words cannot say
    'Тести хука: 6 з 6, тимчасові файли прибрано.',
    'Пробна збірка зі stub пройшла (exit 0).',
    'Kickoff 937 пройшов перевірки.',
    '| Тести quality-скриптів | 181 з 181 |',
    'Lint на PR #28 червоний.',
    'All 21 tests pass.',
    '17 тестів впали.', // the plural form was missed until the reconciliation test of 2026-11-10 hit it
    'Два тести падають у CI.',
    'Lint завершився з кодом 0.', // \b before Cyrillic never matched, found by the reconciliation test of 2026-11-10
    '241 tests fail, the same ones as the baseline.',
  ];
  for (const t of results) assert.equal(resultLines(t).length, 1, `a result: ${t}`);
  for (const t of ['Пишу тест.', 'Усе гаразд, можна продовжувати.', 'Перевіряю, чи зник рядок.', 'Waiting for the matrix pass to finish.']) assert.equal(resultLines(t).length, 0, `not a result: ${t}`);
  assert.equal(resultLines('```\n21/21 tests pass\n```').length, 0, 'a code block is quoted output, not a statement');
  assert.deepEqual(resultLines('Lint на PR #28 червоний [CI: PR #28]')[0].tags, [{ kind: 'CI', value: 'PR #28' }]);
  assert.deepEqual(resultLines('6 з 6 тестів [local: `node --test a.test.mjs`]')[0].tags, [{ kind: 'локально', value: '`node --test a.test.mjs`' }]);
});

const st = { line: 'CI 49899c40f PR #28: 23 of 23 checks concluded, 2 failed, 0 unsigned commit(s)', at: 1 };
const VITEST = 'Test Files  7 failed | 376 passed (383)\n     Tests  17 failed | 6265 passed (6282)';
const run = (command, output, error = false) => ({ command, output, error });

test('a result without its source, or with a source this turn does not back, is a finding', () => {
  const none = provenanceFindings({ reply: 'Маю 17 провалених тестів у 7 файлах.' });
  assert.match(none.join('\n'), /without its source/);
  const local = 'Маю 17 провалених тестів у 7 файлах [локально: `npx vitest run`].';
  assert.match(provenanceFindings({ reply: local, runs: [run('npm run lint', '')] }).join('\n'), /no shell command of this turn contains it/);
  assert.deepEqual(provenanceFindings({ reply: local, runs: [run('npx vitest run src', VITEST, true)] }), []);
  const ci = 'Маю 2 червоні перевірки [CI: PR #28].';
  assert.match(provenanceFindings({ reply: ci }).join('\n'), /ran no `node scripts\/quality\/pipeline\.mjs ci-status 28`/);
  assert.match(provenanceFindings({ reply: ci, ciStatus: () => st }).join('\n'), /does not carry the ci-status line/);
  assert.deepEqual(provenanceFindings({ reply: `${ci}\n${st.line}`, ciStatus: () => st }), [], 'the ci-status line itself is a backed result line');
  const pipe = 'Усі кроки пройшли [pipeline: handoff].';
  assert.match(provenanceFindings({ reply: pipe }).join('\n'), /no complete handoff ledger/);
  assert.deepEqual(provenanceFindings({ reply: pipe, phaseComplete: (p) => p === 'handoff' }), []);
  assert.match(provenanceFindings({ reply: '5 з 6 тестів [локально: ``]' }).join('\n'), /without the command/);
});

test('every number of a sourced result line must be in what that source printed this turn (OWASP: reconcile with observations)', () => {
  // the number is the supplier's assertion; the recorded output is the observation
  const local = (text) => provenanceFindings({ reply: text, runs: [run('npx vitest run src', VITEST, true)] }).join('\n');
  assert.equal(local('Маю 17 провалених тестів у 7 файлах [локально: `npx vitest run`].'), '');
  assert.match(local('Маю 18 провалених тестів у 7 файлах [локально: `npx vitest run`].'), /states 18, which `npx vitest run` did not print/);
  assert.equal(local('6 265 тестів пройшли [локально: `npx vitest run`].'), '', 'digit groups are joined: 6 265 is 6265');
  assert.match(provenanceFindings({ reply: '17 тестів впали [локально: `npx vitest run`].', commands: ['npx vitest run'] }).join('\n'), /not recorded in this turn/, 'a run whose output is not recorded backs no number');
  // exit codes: 0 needs a run that did not end in error; N needs a run that ended with exit N
  assert.equal(provenanceFindings({ reply: 'Lint завершився з кодом 0 [локально: `npm run lint`].', runs: [run('npm run lint', '')] }).join('\n'), '');
  assert.match(provenanceFindings({ reply: 'Lint завершився з кодом 0 [локально: `npm run lint`].', runs: [run('npm run lint', 'Exit code 1\n3 problems', true)] }).join('\n'), /exit 0, which no recorded run/);
  assert.equal(provenanceFindings({ reply: 'Lint: код 1, 3 помилки [локально: `npm run lint`].', runs: [run('npm run lint', 'Exit code 1\n3 problems', true)] }).join('\n'), '');
  // CI numbers come from GitHub's answer as this turn saw it
  assert.equal(provenanceFindings({ reply: `2 перевірки червоні [CI: PR #28].\n${st.line}`, ciStatus: () => st }).join('\n'), '');
  assert.match(provenanceFindings({ reply: `3 перевірки червоні [CI: PR #28].\n${st.line}`, ciStatus: () => st }).join('\n'), /states 3, which ci-status/);
  // pipeline numbers come from the ledger's step summaries
  const pipe = (text) => provenanceFindings({ reply: text, phaseComplete: () => true, phaseOutput: () => 'ci-local 3f2a: 21 passed, 0 failed, 0 unverified' }).join('\n');
  assert.equal(pipe('21 джоб пройшли [pipeline: handoff].'), '');
  assert.match(pipe('22 джоби пройшли [pipeline: handoff].'), /states 22, which the handoff ledger did not print/);
  // identifiers, dates, hashes and references are not counts
  assert.deepEqual(numbersOf('B38, AC5, R10 і Task 971 на 2026-11-10 у 49899c40f, PR #28: 23 з 23').nums, ['971', '23']);
  // a Markdown list marker numbers the item, not a result (Stop hook of 2026-11-11 read "1." as a count)
  assert.deepEqual(numbersOf('1. **Тести:** 5 з 6 пройшли').nums, ['5', '6']);
  assert.deepEqual(numbersOf('  2) 7 тестів впали').nums, ['7']);
  assert.deepEqual(numbersOf('- 3 з 3').nums, ['3']);
});

test('the Stop hook reconciles through the process: the output Claude Code recorded for the call backs the numbers', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'prov-'));
  const git = (...a) => spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'commit.gpgsign=false', ...a], { cwd: root, encoding: 'utf8' });
  git('init', '-q');
  mkdirSync(path.join(root, 'scripts', 'quality'), { recursive: true });
  writeFileSync(path.join(root, 'scripts', 'quality', 'pipeline-steps.json'), readFileSync(path.join(ROOT, 'scripts', 'quality', 'pipeline-steps.json')));
  git('add', '.');
  git('commit', '-q', '-m', 'base');
  const transcript = path.join(root, 't.jsonl');
  const stop = (entries, reply) => {
    writeFileSync(transcript, entries.map((e) => JSON.stringify(e)).join('\n'));
    const r = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'quality', 'pipeline.mjs'), 'stop'], {
      cwd: root, encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: root },
      input: JSON.stringify({ hook_event_name: 'Stop', session_id: `p${Math.random()}`, transcript_path: transcript, last_assistant_message: reply }),
    });
    return r.stdout ? JSON.parse(r.stdout) : {};
  };
  const turn = (command, output, reply, extra = []) => [
    { type: 'user', timestamp: new Date(Date.now() - 1000).toISOString(), message: { content: 'як тести?' } },
    { type: 'assistant', message: { content: [{ type: 'tool_use', id: 'tu1', name: 'Bash', input: { command } }] } },
    { type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 'tu1', content: output, is_error: true }] } },
    ...extra,
    { type: 'assistant', message: { content: [{ type: 'text', text: reply }] } },
  ];
  const ok = 'Маю 17 провалених тестів у 7 файлах [локально: `npx vitest run`].';
  assert.match(stop(turn('npx vitest run', VITEST, 'Маю 17 провалених тестів у 7 файлах.'), 'Маю 17 провалених тестів у 7 файлах.').reason ?? '', /without its source/);
  assert.match(stop(turn('npx vitest run', VITEST, ok.replace('17', '18')), ok.replace('17', '18')).reason ?? '', /states 18/);
  assert.equal(stop(turn('npx vitest run', VITEST, ok), ok).decision, undefined);
  // the hook's own feedback (isMeta) continues the turn: the run before it still backs the corrected reply
  const meta = [{ type: 'user', isMeta: true, timestamp: new Date().toISOString(), message: { content: 'Stop hook feedback:\n- line 1 states a result without its source' } }];
  assert.equal(stop(turn('npx vitest run', VITEST, ok, meta), ok).decision, undefined, 'hook feedback is no new turn');
  rmSync(root, { recursive: true, force: true });
});
