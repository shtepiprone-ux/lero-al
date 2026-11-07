// client-sinks.mjs (whole-project audit 2026-11-06, lane client-ui): each rule refuses its planted sink, the controlled
// form passes, a reviewed sink passes, a stale reviewed entry fails, and the repository itself passes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { scan, PRODUCT } from './client-sinks.mjs';

const ids = (text, reviewed = []) => scan([{ file: 'src/x.tsx', text }], reviewed).map((f) => f.id);

test('each rule refuses its uncontrolled sink and passes the controlled form', () => {
  const cases = [
    ['K1', "parent.postMessage(data, '*')", 'parent.postMessage(data, window.location.origin)'],
    ['K2', "window.addEventListener('message', on)", "window.addEventListener('message', on)\nif (e.origin !== location.origin) return"],
    ['K3', "el.insertAdjacentHTML('beforeend', html)", "el.insertAdjacentText('beforeend', html)"],
    ['K4', "localStorage.setItem('access_token', t)", "localStorage.setItem('theme', t)"],
    ['K5', '<a href={item.link}>', '<a href={safeExternalUrl(item.link)}>'],
    ['K6', 'el.innerHTML += html', 'el.textContent += html'],
    ['K6', 'const f = Function(code)', 'const f = makeFn(code)'],
    ['K6', 'range.createContextualFragment(html)', 'document.createTextNode(html)'],
    ['K6', '<iframe srcDoc={html} />', '<iframe src="/preview" />'],
    ['K6', "a.setAttribute('href', url)", "a.setAttribute('href', '/home')"],
    ['K6', "a.setAttribute('onclick', code)", "a.setAttribute('title', code)"],
    ['K7', 'window.location.href = next', "window.location.href = '/sq'"],
    ['K7', 'location.assign(target)', "location.assign('/sq')"],
    ['K7', 'router.push(next)', 'router.push(safeNextPath(next, origin))'],
    ['K7', "window.open(url, '_blank', 'noopener')", "window.open('/admin', '_blank', 'noopener')"],
    ['K8', '<div dangerouslySetInnerHTML={{ __html: body }} />', '<div>{body}</div>'],
  ];
  for (const [id, bad, good] of cases) {
    assert.deepEqual(ids(bad), [id], bad);
    assert.deepEqual(ids(good), [], good);
  }
});

test('a reviewed sink passes; a reviewed entry with no matching line fails', () => {
  const reviewed = [{ file: 'src/x.tsx', line: 'href={n.link}', rule: 'K5', why: 'open task' }];
  assert.deepEqual(ids('<a href={n.link}>', reviewed), []);
  assert.deepEqual(ids('<a href={safeExternalUrl(n.link)}>', reviewed), ['K0']);
});

test('tests, Stories and test helpers are not product code', () => {
  assert.ok(PRODUCT('src/modules/x/Comp.tsx'));
  for (const f of ['src/a/__tests__/b.ts', 'src/a/b.test.tsx', 'src/a/B.stories.tsx', 'src/stories/x.tsx', 'src/tests/setup.ts']) assert.ok(!PRODUCT(f), f);
});

test('the product code of this repository passes', () => {
  const script = fileURLToPath(new URL('./client-sinks.mjs', import.meta.url));
  const r = spawnSync(process.execPath, [script], { encoding: 'utf8', windowsHide: true });
  assert.equal(r.status, 0, r.stdout + r.stderr);
});
