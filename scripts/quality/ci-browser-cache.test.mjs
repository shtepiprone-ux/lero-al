// node --test scripts/quality/ci-browser-cache.test.mjs
// Task 1013 AC1 (owner decision O957-6, 2026-11-19): every job that installs the browser takes Chromium and its Ubuntu
// packages from a cache that only a push to main writes. The cause (kickoff "## Cause"): run 44514575066 fetched
// 32.1 MB of packages in 13 min 52 s inside the install step and the job ran out of time. OWASP GitHub Actions Security
// ("If an attacker can inject malicious content into the cache and subsequent workflows ... restore and use this
// cache, the poisoned data can be executed in a privileged context"): a pull request only restores; it never saves.
// Each rule has a planted case, so an empty problem list is not an empty scan.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const ci = yaml.load(readFileSync(path.join(ROOT, '.github', 'workflows', 'ci.yml'), 'utf8'));

// actions/cache v6.1.0 (`gh api repos/actions/cache/git/ref/tags/v6.1.0` -> this commit; released 2026-06-26)
const CACHE_SHA = '55cc8345863c7cc4c66a329aec7e433d2d1c52a9';
const RESTORE = `actions/cache/restore@${CACHE_SHA}`;
const SAVE = `actions/cache/save@${CACHE_SHA}`;
// the whole condition: a push to main, optionally narrowed to a cache miss; an `||` (or any other clause) could widen it
const MAIN_PUSH = /^github\.event_name == 'push' && github\.ref == 'refs\/heads\/main'( && steps\.[\w-]+\.outputs\.cache-hit != 'true')?$/;
const INSTALL = /\bplaywright install\b/;
const PATHS = ['~/.cache/ms-playwright', '~/.cache/playwright-apt'];

const pathsOf = (step) => String(step.with?.path ?? '').split('\n').map((p) => p.trim()).filter(Boolean);

/** Why a workflow's browser install could stall on a mirror or restore a cache a pull request wrote; empty when it holds. */
export function browserCacheProblems(workflow) {
  const out = [];
  for (const [id, job] of Object.entries(workflow.jobs ?? {})) {
    const steps = job.steps ?? [];
    steps.forEach((step, i) => {
      const uses = String(step.uses ?? '');
      // any cache action, at any version, that writes: only a push to main may do it
      if (/^actions\/cache(\/save)?@/.test(uses)) {
        if (uses.startsWith('actions/cache@')) out.push(`${id} step ${i + 1}: actions/cache saves at the end of every run; use ${RESTORE} and a main-only ${SAVE}`);
        else if (uses !== SAVE) out.push(`${id} step ${i + 1}: ${uses} is not the pinned ${SAVE}`);
        if (!MAIN_PUSH.test(String(step.if ?? ''))) out.push(`${id} step ${i + 1}: the cache is saved only under github.event_name == 'push' && github.ref == 'refs/heads/main'`);
      }
      if (/^actions\/cache\/restore@/.test(uses) && uses !== RESTORE) out.push(`${id} step ${i + 1}: ${uses} is not the pinned ${RESTORE}`);
    });
    const installs = steps.map((s, i) => [s, i]).filter(([s]) => INSTALL.test(String(s.run ?? '')));
    for (const [install, i] of installs) {
      const restore = steps.findIndex((s) => s.uses === RESTORE);
      if (restore < 0 || restore > i) out.push(`${id}: the browser install (step ${i + 1}) follows a restore of ${RESTORE}`);
      else {
        const missing = PATHS.filter((p) => !pathsOf(steps[restore]).includes(p));
        if (missing.length) out.push(`${id}: the restore holds ${missing.join(' and ')}`);
        if (!/steps\.[\w-]+\.outputs\.key/.test(String(steps[restore].with?.key ?? ''))) out.push(`${id}: the restore key is the computed Playwright and runner-image key`);
      }
      if (!(Number(install['timeout-minutes']) > 0)) out.push(`${id}: the browser install (step ${i + 1}) has its own timeout-minutes`);
    }
    if (installs.length && !steps.some((s) => s.uses === SAVE)) out.push(`${id}: no main-only ${SAVE}, so the cache is never written`);
  }
  return out;
}

test('every job that installs the browser restores it from the cache main writes, with a time limit on the install (AC1)', () => {
  const installing = Object.entries(ci.jobs).filter(([, job]) => (job.steps ?? []).some((s) => INSTALL.test(String(s.run ?? '')))).map(([id]) => id);
  // the four jobs the kickoff names; a new browser job joins the same rule through browserCacheProblems
  assert.deepEqual(installing.sort(), ['click-shield', 'homepage-grid', 'locale-leak', 'quality']);
  assert.deepEqual(browserCacheProblems(ci), []);
});

test('the cache key names the Playwright version and the runner image', () => {
  for (const [id, job] of Object.entries(ci.jobs)) {
    const key = (job.steps ?? []).find((s) => s.id === 'browser-key');
    if (!(job.steps ?? []).some((s) => INSTALL.test(String(s.run ?? '')))) continue;
    assert.ok(key, `${id}: a step computes the key`);
    assert.match(String(key.run), /playwright\/package\.json/, `${id}: the installed Playwright version`);
    assert.match(String(key.run), /\$\{ImageOS\}-\$\{ImageVersion\}/, `${id}: the runner image`);
    assert.doesNotMatch(String(key.run), /\$\{\{/, `${id}: no expression reaches the shell`);
  }
});

test('planted: a save on every run, a save without the main condition, an unpinned action, no restore, no timeout are each refused', () => {
  const quality = () => structuredClone(ci.jobs.quality);
  const wf = (job) => ({ jobs: { quality: job } });
  const at = (job, pred) => job.steps.findIndex(pred);

  let job = quality();
  job.steps.push({ uses: 'actions/cache@0057852bfaa89a56745cba8c7296529d2fc39830', with: { path: '~/x', key: 'k' } });
  assert.ok(browserCacheProblems(wf(job)).some((p) => /saves at the end of every run/.test(p)), 'actions/cache saves on a pull request too');

  job = quality();
  delete job.steps[at(job, (s) => s.uses === SAVE)].if;
  assert.ok(browserCacheProblems(wf(job)).some((p) => /saved only under/.test(p)), 'a save a pull request runs');

  job = quality();
  job.steps[at(job, (s) => s.uses === SAVE)].if = "github.ref == 'refs/heads/main'";
  assert.ok(browserCacheProblems(wf(job)).some((p) => /saved only under/.test(p)), 'main without push (a schedule or a dispatch on main)');

  job = quality();
  job.steps[at(job, (s) => s.uses === SAVE)].if += ' || true';
  assert.ok(browserCacheProblems(wf(job)).some((p) => /saved only under/.test(p)), 'the main condition widened by an || clause');

  job = quality();
  job.steps[at(job, (s) => s.uses === RESTORE)].uses = 'actions/cache/restore@v6';
  assert.ok(browserCacheProblems(wf(job)).some((p) => /not the pinned/.test(p)), 'a tag instead of the commit');

  job = quality();
  job.steps.splice(at(job, (s) => s.uses === RESTORE), 1);
  assert.ok(browserCacheProblems(wf(job)).some((p) => /follows a restore/.test(p)), 'no restore before the install');

  job = quality();
  const restore = job.steps.splice(at(job, (s) => s.uses === RESTORE), 1)[0];
  job.steps.push(restore);
  assert.ok(browserCacheProblems(wf(job)).some((p) => /follows a restore/.test(p)), 'the restore after the install');

  job = quality();
  job.steps[at(job, (s) => s.uses === RESTORE)].with.path = '~/.cache/ms-playwright';
  assert.ok(browserCacheProblems(wf(job)).some((p) => /playwright-apt/.test(p)), 'the packages left out of the cache');

  job = quality();
  delete job.steps[at(job, (s) => INSTALL.test(String(s.run ?? '')))]['timeout-minutes'];
  assert.ok(browserCacheProblems(wf(job)).some((p) => /timeout-minutes/.test(p)), 'an install without its own time limit');

  job = quality();
  job.steps.splice(at(job, (s) => s.uses === SAVE), 1);
  assert.ok(browserCacheProblems(wf(job)).some((p) => /never written/.test(p)), 'nothing ever saves the cache');

  // the control: the job as committed has no problem
  assert.deepEqual(browserCacheProblems(wf(quality())), []);
});
